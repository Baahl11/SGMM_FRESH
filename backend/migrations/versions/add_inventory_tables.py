"""Add inventory tables

Revision ID: add_inventory_tables
Revises: notification_tables_manual
Create Date: 2025-06-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers
revision = 'add_inventory_tables'
down_revision = 'notification_tables_manual'
branch_labels = None
depends_on = None

def upgrade():
    # Create inventory_item table
    op.create_table('inventoryitem',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('descripcion', sa.String(), nullable=True),
        sa.Column('unidad_medida', sa.String(), nullable=False),
        sa.Column('stock_actual', sa.Integer(), nullable=False),
        sa.Column('stock_minimo', sa.Integer(), nullable=False),
        sa.Column('stock_maximo', sa.Integer(), nullable=False),
        sa.Column('costo_unitario', sa.Float(), nullable=False),
        sa.Column('proveedor', sa.String(), nullable=True),
        sa.Column('codigo_producto', sa.String(), nullable=True),
        sa.Column('fecha_vencimiento', sa.Date(), nullable=True),
        sa.Column('ubicacion', sa.String(), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on nombre for searching
    op.create_index(op.f('ix_inventoryitem_nombre'), 'inventoryitem', ['nombre'], unique=False)
    
    # Create inventory_movement table
    op.create_table('inventorymovement',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('cantidad_anterior', sa.Integer(), nullable=False),
        sa.Column('cantidad_nueva', sa.Integer(), nullable=False),
        sa.Column('motivo', sa.String(), nullable=True),
        sa.Column('referencia_id', sa.Integer(), nullable=True),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['inventoryitem.id'], ),
        sa.ForeignKeyConstraint(['usuario_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create index on tipo for filtering
    op.create_index(op.f('ix_inventorymovement_tipo'), 'inventorymovement', ['tipo'], unique=False)
    
    # Create treatment_inventory_item table
    op.create_table('treatmentinventoryitem',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('treatment_id', sa.Integer(), nullable=False),
        sa.Column('inventory_item_id', sa.Integer(), nullable=False),
        sa.Column('cantidad_requerida', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['inventory_item_id'], ['inventoryitem.id'], ),
        sa.ForeignKeyConstraint(['treatment_id'], ['treatment.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    # Drop tables in reverse order
    op.drop_table('treatmentinventoryitem')
    op.drop_index(op.f('ix_inventorymovement_tipo'), table_name='inventorymovement')
    op.drop_table('inventorymovement')
    op.drop_index(op.f('ix_inventoryitem_nombre'), table_name='inventoryitem')
    op.drop_table('inventoryitem')
