const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Validación temprana por si un compañero olvida crear el archivo .env
if (!process.env.MYSQL_URL) {
    console.error('❌ ERROR: No se encontró la variable MYSQL_URL en backend/.env');
    process.exit(1);
}

// Pool de conexiones usando directamente la URL completa de Railway
const db = mysql.createPool(process.env.MYSQL_URL);

// Verificación inicial de conexión al levantar el servidor
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a MySQL en Railway:', err.message);
    } else {
        console.log('✅ Conectado exitosamente a Railway (PRIGMA)');
        connection.release();
    }
});

// Manejo centralizado de errores SQL (Triggers, Llaves Foráneas y Duplicados)
const handleErr = (res, err) => {
    console.error(err);
    // Error lanzado por SIGNAL SQLSTATE '45000' de tus triggers en MySQL
    if (err.sqlState === '45000') {
        return res.status(400).json({ error: err.sqlMessage });
    }
    // Error por restricción ON DELETE RESTRICT (registro usado en otra tabla)
    if (err.errno === 1451 || err.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
            error: 'No se puede eliminar este registro porque tiene movimientos asociados (compras, pedidos o usuarios). Cambia su estado a Inactivo.'
        });
    }
    // Error por dato único duplicado (ej. documento o nombre repetido)
    if (err.errno === 1062 || err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Ya existe un registro con ese documento o nombre único.' });
    }
    return res.status(500).json({ error: err.sqlMessage || err.message });
};

// =====================================================================
// 0. CATÁLOGOS COMPARTIDOS Y AUTENTICACIÓN
// =====================================================================
app.get('/api/estados', (req, res) => {
    db.query('SELECT * FROM estados', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.get('/api/tipos-documento', (req, res) => {
    db.query('SELECT * FROM tipos_documento', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

// Login contra la tabla usuarios (documento + contrasena)
app.post('/api/login', (req, res) => {
    const { documento, contrasena } = req.body;
    const sql = `
    SELECT u.id_usuario, u.nombre_usuario, u.apellido_usuario, u.documento, u.estado, r.id_rol, r.nombre_rol
    FROM usuarios u
    JOIN roles r ON r.id_rol = u.id_rol
    WHERE u.documento = ? AND u.contrasena = ?`;
    db.query(sql, [documento, contrasena], (err, rows) => {
        if (err) return handleErr(res, err);
        if (rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
        if (!rows[0].estado) return res.status(403).json({ error: 'El usuario se encuentra inactivo' });
        res.json({ message: 'Login exitoso', usuario: rows[0] });
    });
});

// =====================================================================
// 1. ROLES, PERMISOS Y PRIVILEGIOS
// =====================================================================
app.get('/api/roles', (req, res) => {
    db.query('SELECT * FROM roles', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/roles', (req, res) => {
    const { nombre_rol, descripcion } = req.body;
    db.query(
        'INSERT INTO roles (nombre_rol, descripcion, estado) VALUES (?, ?, TRUE)',
        [nombre_rol, descripcion || null],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Rol creado', id: result.insertId }))
    );
});

app.put('/api/roles/:id', (req, res) => {
    const { nombre_rol, descripcion } = req.body;
    db.query(
        'UPDATE roles SET nombre_rol = ?, descripcion = ? WHERE id_rol = ?',
        [nombre_rol, descripcion || null, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Rol actualizado' }))
    );
});

app.patch('/api/roles/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE roles SET estado = ? WHERE id_rol = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de rol actualizado' })
    );
});

app.delete('/api/roles/:id', (req, res) => {
    // Primero limpia asignaciones en roles_permisos_privilegios y luego elimina el rol
    db.query('DELETE FROM roles_permisos_privilegios WHERE id_rol = ?', [req.params.id], (err) => {
        if (err) return handleErr(res, err);
        db.query('DELETE FROM roles WHERE id_rol = ?', [req.params.id], (err2) =>
            err2 ? handleErr(res, err2) : res.json({ message: 'Rol eliminado definitivamente' })
        );
    });
});

app.get('/api/permisos', (req, res) => {
    db.query('SELECT * FROM permisos', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.get('/api/privilegios', (req, res) => {
    db.query('SELECT * FROM privilegios', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.get('/api/roles/:id/permisos', (req, res) => {
    const sql = `
    SELECT rpp.id_rol, p.id_permiso, p.nombre_permiso, pr.id_privilegio, pr.nombre_privilegio, rpp.estado_permiso
    FROM roles_permisos_privilegios rpp
    JOIN permisos_privilegios pp ON pp.id_permiso_privilegio = rpp.id_permiso_privilegio
    JOIN permisos p ON p.id_permiso = pp.id_permiso
    JOIN privilegios pr ON pr.id_privilegio = pp.id_privilegio
    WHERE rpp.id_rol = ?`;
    db.query(sql, [req.params.id], (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

// =====================================================================
// 2. USUARIOS / EMPLEADOS Y AGENDA (HORARIOS)
// =====================================================================
app.get('/api/usuarios', (req, res) => {
    const sql = `
    SELECT u.id_usuario, u.nombre_usuario, u.apellido_usuario, u.id_tipo_documento,
           td.descripcion AS tipo_documento, u.documento, u.telefono,
           u.id_rol, r.nombre_rol, u.estado, u.fecha_creacion
    FROM usuarios u
    JOIN tipos_documento td ON td.id_tipo_documento = u.id_tipo_documento
    JOIN roles r ON r.id_rol = u.id_rol`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/usuarios', (req, res) => {
    const { nombre_usuario, apellido_usuario, id_tipo_documento, documento, telefono, contrasena, id_rol } = req.body;
    const sql = `INSERT INTO usuarios 
    (nombre_usuario, apellido_usuario, id_tipo_documento, documento, telefono, contrasena, id_rol, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`;
    db.query(
        sql,
        [nombre_usuario, apellido_usuario, id_tipo_documento, documento, telefono || null, contrasena, id_rol],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Usuario creado', id: result.insertId }))
    );
});

app.put('/api/usuarios/:id', (req, res) => {
    const { nombre_usuario, apellido_usuario, id_tipo_documento, documento, telefono, id_rol } = req.body;
    const sql = `UPDATE usuarios 
    SET nombre_usuario = ?, apellido_usuario = ?, id_tipo_documento = ?, documento = ?, telefono = ?, id_rol = ?
    WHERE id_usuario = ?`;
    db.query(
        sql,
        [nombre_usuario, apellido_usuario, id_tipo_documento, documento, telefono || null, id_rol, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Usuario actualizado' }))
    );
});

app.patch('/api/usuarios/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE usuarios SET estado = ? WHERE id_usuario = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de usuario actualizado' })
    );
});

app.delete('/api/usuarios/:id', (req, res) => {
    db.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Usuario eliminado definitivamente' })
    );
});

// Agenda / Horarios de empleados
app.get('/api/horarios', (req, res) => {
    const sql = `
    SELECT h.id_horario, h.id_usuario, u.nombre_usuario, u.apellido_usuario, r.nombre_rol, h.fecha_trabajo
    FROM horarios_empleados h
    JOIN usuarios u ON u.id_usuario = h.id_usuario
    JOIN roles r ON r.id_rol = u.id_rol
    ORDER BY h.fecha_trabajo DESC`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/horarios', (req, res) => {
    const { id_usuario, fecha_trabajo } = req.body;
    db.query(
        'INSERT INTO horarios_empleados (id_usuario, fecha_trabajo) VALUES (?, ?)',
        [id_usuario, fecha_trabajo],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Turno asignado', id: result.insertId }))
    );
});

app.put('/api/horarios/:id', (req, res) => {
    const { id_usuario, fecha_trabajo } = req.body;
    db.query(
        'UPDATE horarios_empleados SET id_usuario = ?, fecha_trabajo = ? WHERE id_horario = ?',
        [id_usuario, fecha_trabajo, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Turno actualizado' }))
    );
});

app.delete('/api/horarios/:id', (req, res) => {
    db.query('DELETE FROM horarios_empleados WHERE id_horario = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Turno eliminado definitivamente' })
    );
});

// =====================================================================
// 3. CATEGORÍAS DE PRODUCTOS Y PRODUCTOS
// =====================================================================
app.get('/api/categorias-producto', (req, res) => {
    db.query('SELECT * FROM categorias_producto', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/categorias-producto', (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    db.query(
        'INSERT INTO categorias_producto (nombre_categoria, descripcion) VALUES (?, ?)',
        [nombre_categoria, descripcion || null],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Categoría creada', id: result.insertId }))
    );
});

app.put('/api/categorias-producto/:id', (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    db.query(
        'UPDATE categorias_producto SET nombre_categoria = ?, descripcion = ? WHERE id_categoria_producto = ?',
        [nombre_categoria, descripcion || null, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Categoría actualizada' }))
    );
});

app.delete('/api/categorias-producto/:id', (req, res) => {
    db.query('DELETE FROM categorias_producto WHERE id_categoria_producto = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Categoría eliminada definitivamente' })
    );
});

app.get('/api/productos', (req, res) => {
    const sql = `
    SELECT p.*, c.nombre_categoria
    FROM productos p
    JOIN categorias_producto c ON c.id_categoria_producto = p.id_categoria_producto`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/productos', (req, res) => {
    const { nombre_producto, precio_venta, costo, stock, stock_minimo, imagen, id_categoria_producto } = req.body;
    const sql = `INSERT INTO productos 
    (nombre_producto, precio_venta, costo, stock, stock_minimo, imagen, id_categoria_producto, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`;
    db.query(
        sql,
        [nombre_producto, precio_venta, costo, stock || 0, stock_minimo || 0, imagen || null, id_categoria_producto],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Producto creado', id: result.insertId }))
    );
});

app.put('/api/productos/:id', (req, res) => {
    const { nombre_producto, precio_venta, costo, stock, stock_minimo, imagen, id_categoria_producto } = req.body;
    const sql = `UPDATE productos 
    SET nombre_producto = ?, precio_venta = ?, costo = ?, stock = ?, stock_minimo = ?, imagen = ?, id_categoria_producto = ?
    WHERE id_producto = ?`;
    db.query(
        sql,
        [nombre_producto, precio_venta, costo, stock, stock_minimo, imagen || null, id_categoria_producto, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Producto actualizado' }))
    );
});

app.patch('/api/productos/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE productos SET estado = ? WHERE id_producto = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de producto actualizado' })
    );
});

app.delete('/api/productos/:id', (req, res) => {
    db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Producto eliminado definitivamente' })
    );
});

// =====================================================================
// 4. PROVEEDORES Y CATEGORÍAS QUE SURTEN
// =====================================================================
app.get('/api/proveedores', (req, res) => {
    const sql = `
    SELECT pr.*, td.descripcion AS tipo_documento
    FROM proveedores pr
    JOIN tipos_documento td ON td.id_tipo_documento = pr.id_tipo_documento`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/proveedores', (req, res) => {
    const {
        nombre_proveedor, persona_juridica, id_tipo_documento, documento,
        contacto_persona, correo_proveedor, telefono_proveedor
    } = req.body;
    const sql = `INSERT INTO proveedores 
    (nombre_proveedor, persona_juridica, id_tipo_documento, documento, contacto_persona, correo_proveedor, telefono_proveedor, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`;
    db.query(
        sql,
        [nombre_proveedor, persona_juridica, id_tipo_documento, documento, contacto_persona || null, correo_proveedor || null, telefono_proveedor || null],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Proveedor creado', id: result.insertId }))
    );
});

app.put('/api/proveedores/:id', (req, res) => {
    const {
        nombre_proveedor, persona_juridica, id_tipo_documento, documento,
        contacto_persona, correo_proveedor, telefono_proveedor
    } = req.body;
    const sql = `UPDATE proveedores SET 
    nombre_proveedor = ?, persona_juridica = ?, id_tipo_documento = ?, documento = ?,
    contacto_persona = ?, correo_proveedor = ?, telefono_proveedor = ?
    WHERE id_proveedor = ?`;
    db.query(
        sql,
        [nombre_proveedor, persona_juridica, id_tipo_documento, documento, contacto_persona || null, correo_proveedor || null, telefono_proveedor || null, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Proveedor actualizado' }))
    );
});

app.patch('/api/proveedores/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE proveedores SET estado = ? WHERE id_proveedor = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de proveedor actualizado' })
    );
});

app.delete('/api/proveedores/:id', (req, res) => {
    db.query('DELETE FROM proveedor_categoria WHERE id_proveedor = ?', [req.params.id], (err) => {
        if (err) return handleErr(res, err);
        db.query('DELETE FROM proveedores WHERE id_proveedor = ?', [req.params.id], (err2) =>
            err2 ? handleErr(res, err2) : res.json({ message: 'Proveedor eliminado definitivamente' })
        );
    });
});

// Categorías asociadas a un proveedor
app.get('/api/proveedores/:id/categorias', (req, res) => {
    const sql = `
    SELECT cp.*
    FROM proveedor_categoria pc
    JOIN categorias_producto cp ON cp.id_categoria_producto = pc.id_categoria_producto
    WHERE pc.id_proveedor = ?`;
    db.query(sql, [req.params.id], (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/proveedores/:id/categorias', (req, res) => {
    const { id_categoria_producto } = req.body;
    db.query(
        'INSERT INTO proveedor_categoria (id_proveedor, id_categoria_producto) VALUES (?, ?)',
        [req.params.id, id_categoria_producto],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Categoría vinculada al proveedor' }))
    );
});

app.delete('/api/proveedores/:id/categorias/:idCategoria', (req, res) => {
    db.query(
        'DELETE FROM proveedor_categoria WHERE id_proveedor = ? AND id_categoria_producto = ?',
        [req.params.id, req.params.idCategoria],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Categoría desvinculada del proveedor' }))
    );
});

// =====================================================================
// 5. CATEGORÍAS DE SERVICIOS Y SERVICIOS
// =====================================================================
app.get('/api/categorias-servicio', (req, res) => {
    db.query('SELECT * FROM categorias_servicio', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/categorias-servicio', (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    db.query(
        'INSERT INTO categorias_servicio (nombre_categoria, descripcion) VALUES (?, ?)',
        [nombre_categoria, descripcion || null],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Categoría de servicio creada', id: result.insertId }))
    );
});

app.put('/api/categorias-servicio/:id', (req, res) => {
    const { nombre_categoria, descripcion } = req.body;
    db.query(
        'UPDATE categorias_servicio SET nombre_categoria = ?, descripcion = ? WHERE id_categoria_servicio = ?',
        [nombre_categoria, descripcion || null, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Categoría de servicio actualizada' }))
    );
});

app.delete('/api/categorias-servicio/:id', (req, res) => {
    db.query('DELETE FROM categorias_servicio WHERE id_categoria_servicio = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Categoría de servicio eliminada definitivamente' })
    );
});

app.get('/api/servicios', (req, res) => {
    const sql = `
    SELECT s.*, cs.nombre_categoria
    FROM servicios s
    JOIN categorias_servicio cs ON cs.id_categoria_servicio = s.id_categoria_servicio`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/servicios', (req, res) => {
    const { nombre_servicio, id_categoria_servicio, precio_venta, costo, duracion_minutos } = req.body;
    const sql = `INSERT INTO servicios 
    (nombre_servicio, id_categoria_servicio, precio_venta, costo, duracion_minutos, estado)
    VALUES (?, ?, ?, ?, ?, TRUE)`;
    db.query(
        sql,
        [nombre_servicio, id_categoria_servicio, precio_venta, costo, duracion_minutos],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Servicio creado', id: result.insertId }))
    );
});

app.put('/api/servicios/:id', (req, res) => {
    const { nombre_servicio, id_categoria_servicio, precio_venta, costo, duracion_minutos } = req.body;
    const sql = `UPDATE servicios 
    SET nombre_servicio = ?, id_categoria_servicio = ?, precio_venta = ?, costo = ?, duracion_minutos = ?
    WHERE id_servicio = ?`;
    db.query(
        sql,
        [nombre_servicio, id_categoria_servicio, precio_venta, costo, duracion_minutos, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Servicio actualizado' }))
    );
});

app.patch('/api/servicios/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE servicios SET estado = ? WHERE id_servicio = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de servicio actualizado' })
    );
});

app.delete('/api/servicios/:id', (req, res) => {
    db.query('DELETE FROM servicios WHERE id_servicio = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Servicio eliminado definitivamente' })
    );
});

// =====================================================================
// 6. CLIENTES
// =====================================================================
app.get('/api/clientes', (req, res) => {
    db.query('SELECT * FROM clientes', (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/clientes', (req, res) => {
    const { nombre_cliente } = req.body;
    db.query(
        'INSERT INTO clientes (nombre_cliente, estado) VALUES (?, TRUE)',
        [nombre_cliente],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Cliente creado', id: result.insertId }))
    );
});

app.put('/api/clientes/:id', (req, res) => {
    const { nombre_cliente } = req.body;
    db.query(
        'UPDATE clientes SET nombre_cliente = ? WHERE id_cliente = ?',
        [nombre_cliente, req.params.id],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Cliente actualizado' }))
    );
});

app.patch('/api/clientes/:id/estado', (req, res) => {
    const { estado } = req.body;
    db.query('UPDATE clientes SET estado = ? WHERE id_cliente = ?', [estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de cliente actualizado' })
    );
});

app.delete('/api/clientes/:id', (req, res) => {
    db.query('DELETE FROM clientes WHERE id_cliente = ?', [req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Cliente eliminado definitivamente' })
    );
});

// =====================================================================
// 7. COMPRAS (vista_compras_resumen + Maestro/Detalle + Triggers)
// =====================================================================
app.get('/api/compras', (req, res) => {
    const sql = `
    SELECT v.*, pr.nombre_proveedor, cp.nombre_categoria, u.nombre_usuario
    FROM vista_compras_resumen v
    JOIN proveedores pr ON pr.id_proveedor = v.id_proveedor
    JOIN categorias_producto cp ON cp.id_categoria_producto = v.id_categoria_producto
    JOIN usuarios u ON u.id_usuario = v.id_usuario
    ORDER BY v.fecha_compra DESC`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.get('/api/compras/:id/detalle', (req, res) => {
    const sql = `
    SELECT dc.*, p.nombre_producto
    FROM detalle_compras dc
    JOIN productos p ON p.id_producto = dc.id_producto
    WHERE dc.id_compra = ?`;
    db.query(sql, [req.params.id], (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.post('/api/compras', (req, res) => {
    const { num_factura_proveedor, id_proveedor, id_categoria_producto, id_usuario, id_estado } = req.body;
    const sql = `INSERT INTO compras 
    (num_factura_proveedor, id_proveedor, id_categoria_producto, id_usuario, id_estado)
    VALUES (?, ?, ?, ?, ?)`;
    db.query(
        sql,
        [num_factura_proveedor, id_proveedor, id_categoria_producto, id_usuario, id_estado],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Compra registrada', id: result.insertId }))
    );
});

app.post('/api/compras/:id/detalle', (req, res) => {
    const { id_producto, cantidad, precio_unitario, porcentaje_descuento, porcentaje_iva } = req.body;
    const sql = `INSERT INTO detalle_compras 
    (id_compra, id_producto, cantidad, precio_unitario, porcentaje_descuento, porcentaje_iva)
    VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(
        sql,
        [req.params.id, id_producto, cantidad, precio_unitario, porcentaje_descuento || 0, porcentaje_iva || 0],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Producto agregado a la compra', id: result.insertId }))
    );
});

app.patch('/api/compras/:id/estado', (req, res) => {
    const { id_estado } = req.body;
    db.query('UPDATE compras SET id_estado = ? WHERE id_compra = ?', [id_estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de compra actualizado' })
    );
});

// Eliminar un producto puntual de una compra abierta (Apartada/Pendiente)
app.delete('/api/compras/:id/detalle/:idDetalle', (req, res) => {
    db.query(
        'DELETE FROM detalle_compras WHERE id_compra = ? AND id_detalle_compra = ?',
        [req.params.id, req.params.idDetalle],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Producto eliminado de la compra' }))
    );
});

// Eliminar una compra abierta completa (el trigger impide borrar compras Completadas/Canceladas)
app.delete('/api/compras/:id', (req, res) => {
    db.query('DELETE FROM detalle_compras WHERE id_compra = ?', [req.params.id], (err) => {
        if (err) return handleErr(res, err);
        db.query('DELETE FROM compras WHERE id_compra = ?', [req.params.id], (err2) =>
            err2 ? handleErr(res, err2) : res.json({ message: 'Compra eliminada definitivamente' })
        );
    });
});

// =====================================================================
// 8. PEDIDOS Y ABONOS (vista_pedidos_resumen + Triggers)
// =====================================================================
app.get('/api/pedidos', (req, res) => {
    const sql = `
    SELECT v.*, c.nombre_cliente, u.nombre_usuario
    FROM vista_pedidos_resumen v
    JOIN clientes c ON c.id_cliente = v.id_cliente
    JOIN usuarios u ON u.id_usuario = v.id_usuario
    ORDER BY v.fecha_pedido DESC`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

app.get('/api/pedidos/:id/detalle', (req, res) => {
    const id = req.params.id;
    const qProd = `SELECT d.*, p.nombre_producto FROM detalle_pedido_productos d JOIN productos p ON p.id_producto = d.id_producto WHERE d.id_pedido = ?`;
    const qServ = `SELECT d.*, s.nombre_servicio FROM detalle_pedido_servicios d JOIN servicios s ON s.id_servicio = d.id_servicio WHERE d.id_pedido = ?`;
    const qPago = `SELECT * FROM pagos_pedido WHERE id_pedido = ?`;

    db.query(qProd, [id], (err, productos) => {
        if (err) return handleErr(res, err);
        db.query(qServ, [id], (err2, servicios) => {
            if (err2) return handleErr(res, err2);
            db.query(qPago, [id], (err3, pagos) => {
                if (err3) return handleErr(res, err3);
                res.json({ productos, servicios, pagos });
            });
        });
    });
});

app.post('/api/pedidos', (req, res) => {
    const { id_cliente, id_usuario, id_estado, descuento, porcentaje_iva } = req.body;
    const sql = `INSERT INTO pedidos (id_cliente, id_usuario, id_estado, descuento, porcentaje_iva)
               VALUES (?, ?, ?, ?, ?)`;
    db.query(
        sql,
        [id_cliente, id_usuario, id_estado, descuento || 0, porcentaje_iva ?? 19],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Pedido creado', id: result.insertId }))
    );
});

app.post('/api/pedidos/:id/productos', (req, res) => {
    const { id_producto, precio_unitario, cantidad } = req.body;
    db.query(
        'INSERT INTO detalle_pedido_productos (id_pedido, id_producto, precio_unitario, cantidad) VALUES (?, ?, ?, ?)',
        [req.params.id, id_producto, precio_unitario, cantidad],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Producto agregado al pedido', id: result.insertId }))
    );
});

app.post('/api/pedidos/:id/servicios', (req, res) => {
    const { id_servicio, precio_unitario, cantidad } = req.body;
    db.query(
        'INSERT INTO detalle_pedido_servicios (id_pedido, id_servicio, precio_unitario, cantidad) VALUES (?, ?, ?, ?)',
        [req.params.id, id_servicio, precio_unitario, cantidad],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Servicio agregado al pedido', id: result.insertId }))
    );
});

app.post('/api/pedidos/:id/pagos', (req, res) => {
    const { monto, pago_efectivo } = req.body;
    db.query(
        'INSERT INTO pagos_pedido (id_pedido, monto, pago_efectivo) VALUES (?, ?, ?)',
        [req.params.id, monto, pago_efectivo ?? true],
        (err, result) => (err ? handleErr(res, err) : res.json({ message: 'Abono registrado', id: result.insertId }))
    );
});

app.patch('/api/pedidos/:id/estado', (req, res) => {
    const { id_estado } = req.body;
    db.query('UPDATE pedidos SET id_estado = ? WHERE id_pedido = ?', [id_estado, req.params.id], (err) =>
        err ? handleErr(res, err) : res.json({ message: 'Estado de pedido actualizado' })
    );
});

// Eliminar líneas individuales o abonos de un pedido abierto (el trigger devuelve el stock automáticamente)
app.delete('/api/pedidos/:id/productos/:idDetalle', (req, res) => {
    db.query(
        'DELETE FROM detalle_pedido_productos WHERE id_pedido = ? AND id_detalle_pedido_producto = ?',
        [req.params.id, req.params.idDetalle],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Producto eliminado del pedido y stock devuelto' }))
    );
});

app.delete('/api/pedidos/:id/servicios/:idDetalle', (req, res) => {
    db.query(
        'DELETE FROM detalle_pedido_servicios WHERE id_pedido = ? AND id_detalle_pedido_servicio = ?',
        [req.params.id, req.params.idDetalle],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Servicio eliminado del pedido' }))
    );
});

app.delete('/api/pedidos/:id/pagos/:idPago', (req, res) => {
    db.query(
        'DELETE FROM pagos_pedido WHERE id_pedido = ? AND id_pago = ?',
        [req.params.id, req.params.idPago],
        (err) => (err ? handleErr(res, err) : res.json({ message: 'Abono eliminado del pedido' }))
    );
});

// Eliminar un pedido abierto completo (limpia sus líneas/pagos y devuelve el stock vía triggers)
app.delete('/api/pedidos/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM detalle_pedido_productos WHERE id_pedido = ?', [id], (err1) => {
        if (err1) return handleErr(res, err1);
        db.query('DELETE FROM detalle_pedido_servicios WHERE id_pedido = ?', [id], (err2) => {
            if (err2) return handleErr(res, err2);
            db.query('DELETE FROM pagos_pedido WHERE id_pedido = ?', [id], (err3) => {
                if (err3) return handleErr(res, err3);
                db.query('DELETE FROM pedidos WHERE id_pedido = ?', [id], (err4) =>
                    err4 ? handleErr(res, err4) : res.json({ message: 'Pedido eliminado definitivamente' })
                );
            });
        });
    });
});

// =====================================================================
// 9. VENTAS (Consulta a vista_ventas: pedidos en estado Completado)
// =====================================================================
app.get('/api/ventas', (req, res) => {
    const sql = `
    SELECT v.*, c.nombre_cliente, u.nombre_usuario
    FROM vista_ventas v
    JOIN clientes c ON c.id_cliente = v.id_cliente
    JOIN usuarios u ON u.id_usuario = v.id_usuario
    ORDER BY v.fecha_pedido DESC`;
    db.query(sql, (err, rows) => (err ? handleErr(res, err) : res.json(rows)));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor API PRIGMA corriendo en http://localhost:${PORT}`);
});