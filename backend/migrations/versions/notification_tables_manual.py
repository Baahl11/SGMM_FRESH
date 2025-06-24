"""Create notification system tables manually

Revision ID: notification_tables_manual
Revises: b1d113bea618
Create Date: 2025-06-20 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = 'notification_tables_manual'
down_revision: Union[str, None] = 'b1d113bea618'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create NotificationConfig table
    op.create_table(
        'notificationconfig',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email_enabled', sa.Boolean, default=False, nullable=False),
        sa.Column('whatsapp_enabled', sa.Boolean, default=False, nullable=False),
        sa.Column('email_advance_hours', sa.Integer, default=24, nullable=False),
        sa.Column('whatsapp_advance_hours', sa.Integer, default=2, nullable=False),
        sa.Column('email_template', sa.Text, nullable=False),
        sa.Column('whatsapp_template', sa.Text, nullable=False),
        sa.Column('sendgrid_api_key', sa.Text, nullable=True),
        sa.Column('twilio_account_sid', sa.Text, nullable=True),
        sa.Column('twilio_auth_token', sa.Text, nullable=True),
        sa.Column('twilio_phone_number', sa.Text, nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )
    
    # Create Appointment table
    op.create_table(
        'appointment',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('patient_id', sa.Integer, sa.ForeignKey('patient.id'), nullable=False),
        sa.Column('appointment_date', sa.DateTime, nullable=False),
        sa.Column('appointment_time', sa.String, nullable=False),
        sa.Column('duration_minutes', sa.Integer, default=60, nullable=False),
        sa.Column('treatment_name', sa.String, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('status', sa.String, default='scheduled', nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
    )
    
    # Create NotificationLog table
    op.create_table(
        'notificationlog',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('appointment_id', sa.Integer, sa.ForeignKey('appointment.id'), nullable=False),
        sa.Column('notification_type', sa.String, nullable=False),
        sa.Column('status', sa.String, default='pending', nullable=False),
        sa.Column('scheduled_for', sa.DateTime, nullable=False),
        sa.Column('sent_at', sa.DateTime, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('message_content', sa.Text, nullable=True),
        sa.Column('external_id', sa.String, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )

def downgrade() -> None:
    op.drop_table('notificationlog')
    op.drop_table('appointment')
    op.drop_table('notificationconfig')
