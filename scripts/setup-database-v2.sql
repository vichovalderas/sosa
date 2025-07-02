-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    profile_image_url TEXT,
    role VARCHAR(50) DEFAULT 'user'
);

-- Crear tabla de sesiones de movimiento
CREATE TABLE IF NOT EXISTS motion_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    total_data_points INTEGER DEFAULT 0,
    hand_sensor_active BOOLEAN DEFAULT FALSE,
    finger_sensor_active BOOLEAN DEFAULT FALSE,
    session_metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de datos de movimiento
CREATE TABLE IF NOT EXISTS motion_data (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES motion_sessions(id) ON DELETE CASCADE,
    timestamp BIGINT NOT NULL,
    sensor_type VARCHAR(20) NOT NULL, -- 'hand' or 'finger'
    accel_x DECIMAL(10,6) NOT NULL,
    accel_y DECIMAL(10,6) NOT NULL,
    accel_z DECIMAL(10,6) NOT NULL,
    gyro_x DECIMAL(10,6) NOT NULL,
    gyro_y DECIMAL(10,6) NOT NULL,
    gyro_z DECIMAL(10,6) NOT NULL,
    compensated_accel_x DECIMAL(10,6),
    compensated_accel_y DECIMAL(10,6),
    compensated_accel_z DECIMAL(10,6),
    compensated_gyro_x DECIMAL(10,6),
    compensated_gyro_y DECIMAL(10,6),
    compensated_gyro_z DECIMAL(10,6),
    quality_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de patrones detectados
CREATE TABLE IF NOT EXISTS detected_patterns (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES motion_sessions(id) ON DELETE CASCADE,
    pattern_name VARCHAR(255) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    start_timestamp BIGINT NOT NULL,
    end_timestamp BIGINT NOT NULL,
    duration_ms INTEGER NOT NULL,
    characteristics JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_motion_sessions_user_id ON motion_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_motion_data_session_id ON motion_data(session_id);
CREATE INDEX IF NOT EXISTS idx_motion_data_timestamp ON motion_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_detected_patterns_session_id ON detected_patterns(session_id);

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para actualizar updated_at en users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuario de prueba con hash simple (password: demo123)
INSERT INTO users (email, password_hash, name, is_verified) 
VALUES (
    'demo@sosa.com', 
    'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', -- Simple hash of 'demo123'
    'Usuario Demo',
    TRUE
) ON CONFLICT (email) DO NOTHING;
