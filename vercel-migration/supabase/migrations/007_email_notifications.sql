-- Migration 007: Email Notifications System
-- Sistema de notificaciones por email con SMTP nativo

-- 1. Tabla de configuración de email SMTP
CREATE TABLE IF NOT EXISTS email_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- SMTP Configuration
    smtp_host VARCHAR(255), -- smtp.gmail.com, smtp-mail.outlook.com, etc.
    smtp_port INTEGER DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user VARCHAR(255), -- doctor's email
    smtp_password TEXT, -- encrypted password or app password
    from_email VARCHAR(255), -- email sender
    from_name VARCHAR(255), -- "Dr. Juan Pérez - Clínica XYZ"
    
    -- Email Settings
    email_enabled BOOLEAN DEFAULT false,
    signature TEXT, -- email signature
    
    -- Usage Limits
    daily_email_limit INTEGER DEFAULT 500, -- Gmail: 500/day, Outlook: 300/day
    current_daily_usage INTEGER DEFAULT 0,
    last_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Provider Detection
    email_provider VARCHAR(50), -- 'gmail', 'outlook', 'custom'
    
    -- Fallback to Resend
    use_resend_fallback BOOLEAN DEFAULT false,
    resend_api_key TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- 2. Tabla de plantillas de email
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template Info
    template_type VARCHAR(50) NOT NULL, -- 'booking_received', 'booking_confirmed', 'booking_cancelled', 'reminder_24h', 'reminder_1h'
    template_name VARCHAR(255) NOT NULL,
    
    -- Email Content
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT, -- plain text version
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, template_type)
);

-- 3. Tabla de logs de notificaciones (unifica email + WhatsApp)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Related Records
    booking_id UUID REFERENCES public_bookings(id) ON DELETE SET NULL,
    appointment_id UUID,
    patient_id UUID,
    
    -- Notification Details
    notification_type VARCHAR(20) NOT NULL, -- 'email', 'whatsapp', 'sms'
    event_type VARCHAR(50) NOT NULL, -- 'booking_received', 'booking_confirmed', etc.
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    
    -- Content
    subject TEXT,
    message_body TEXT,
    
    -- Delivery Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered', 'read'
    
    -- Provider Info
    provider VARCHAR(50), -- 'smtp', 'resend', 'whatsapp_business'
    provider_message_id TEXT,
    
    -- Error Handling
    error_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_booking_id ON notification_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- 4. RLS Policies
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Email Config Policies
CREATE POLICY "Users can view their own email config"
    ON email_config FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email config"
    ON email_config FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email config"
    ON email_config FOR UPDATE
    USING (auth.uid() = user_id);

-- Email Templates Policies
CREATE POLICY "Users can view their own email templates"
    ON email_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email templates"
    ON email_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email templates"
    ON email_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email templates"
    ON email_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Notification Logs Policies
CREATE POLICY "Users can view their own notification logs"
    ON notification_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification logs"
    ON notification_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Function to reset daily email usage
CREATE OR REPLACE FUNCTION reset_daily_email_usage()
RETURNS void AS $$
BEGIN
    UPDATE email_config
    SET current_daily_usage = 0,
        last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to increment email usage
CREATE OR REPLACE FUNCTION increment_email_usage(p_user_id UUID)
RETURNS void AS $$
BEGIN
    -- First, reset if needed
    PERFORM reset_daily_email_usage();
    
    -- Then increment
    UPDATE email_config
    SET current_daily_usage = current_daily_usage + 1,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Insert default email templates
INSERT INTO email_templates (user_id, template_type, template_name, subject, body_html, body_text, is_active)
SELECT 
    id as user_id,
    'booking_received' as template_type,
    'Nueva Reserva Recibida' as template_name,
    '✅ Reserva Recibida - {{clinic_name}}' as subject,
    '<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981;">¡Gracias por tu reserva!</h2>
                <p>Hola <strong>{{patient_name}}</strong>,</p>
                <p>Hemos recibido tu solicitud de reserva y la estamos revisando.</p>
                
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #059669;">Detalles de tu Reserva:</h3>
                    <p><strong>📅 Fecha:</strong> {{booking_date}}</p>
                    <p><strong>⏰ Hora:</strong> {{booking_time}}</p>
                    <p><strong>💼 Servicio:</strong> {{service_name}}</p>
                    <p><strong>⏱️ Duración:</strong> {{service_duration}} minutos</p>
                    <p><strong>💰 Precio:</strong> ${{service_price}}</p>
                </div>
                
                <p>Te confirmaremos tu cita a la brevedad.</p>
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 0.9em;">
                    {{clinic_name}}<br>
                    📞 {{clinic_phone}}<br>
                    📍 {{clinic_address}}
                </p>
            </div>
        </body>
    </html>' as body_html,
    'Hola {{patient_name}}, hemos recibido tu reserva para el {{booking_date}} a las {{booking_time}}. Te confirmaremos pronto.' as body_text,
    true as is_active
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM email_templates WHERE user_id = auth.users.id AND template_type = 'booking_received'
);

-- More default templates...
INSERT INTO email_templates (user_id, template_type, template_name, subject, body_html, body_text, is_active)
SELECT 
    id as user_id,
    'booking_confirmed' as template_type,
    'Reserva Confirmada' as template_name,
    '✅ Cita Confirmada - {{clinic_name}}' as subject,
    '<html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981;">¡Tu cita ha sido confirmada! ✅</h2>
                <p>Hola <strong>{{patient_name}}</strong>,</p>
                <p>Tu cita ha sido confirmada exitosamente.</p>
                
                <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #059669;">Detalles de tu Cita:</h3>
                    <p><strong>📅 Fecha:</strong> {{booking_date}}</p>
                    <p><strong>⏰ Hora:</strong> {{booking_time}}</p>
                    <p><strong>💼 Servicio:</strong> {{service_name}}</p>
                </div>
                
                <p>Te esperamos puntualmente. Por favor llega 10 minutos antes.</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 0.9em;">
                    {{clinic_name}}<br>
                    📞 {{clinic_phone}}<br>
                    📍 {{clinic_address}}
                </p>
            </div>
        </body>
    </html>' as body_html,
    'Hola {{patient_name}}, tu cita para el {{booking_date}} a las {{booking_time}} ha sido confirmada. Te esperamos!' as body_text,
    true as is_active
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM email_templates WHERE user_id = auth.users.id AND template_type = 'booking_confirmed'
);

COMMENT ON TABLE email_config IS 'Configuración SMTP para envío de emails desde cuenta del doctor';
COMMENT ON TABLE email_templates IS 'Plantillas personalizables de email para diferentes eventos';
COMMENT ON TABLE notification_logs IS 'Historial unificado de notificaciones (email + WhatsApp)';
