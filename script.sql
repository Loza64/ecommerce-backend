BEGIN;

-- Asigna todos los permisos al rol ADMIN.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

COMMIT;

-- Consultas opcionales para verificar resultados.
SELECT * FROM roles;
SELECT * FROM role_permissions;
SELECT * FROM permissions;
