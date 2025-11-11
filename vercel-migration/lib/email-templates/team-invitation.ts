/**
 * Team Invitation Email Template
 */

export interface TeamInvitationEmailData {
  invitedEmail: string;
  ownerEmail: string;
  ownerName?: string;
  role: string;
  invitationUrl: string;
}

export function generateTeamInvitationEmail(data: TeamInvitationEmailData) {
  const { invitedEmail, ownerEmail, ownerName, role, invitationUrl } = data;

  const subject = `Invitación para unirte al equipo en AgendaMedPro`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación al Equipo</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                🎉 ¡Has sido invitado!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${ownerName || ownerEmail}</strong> te ha invitado a unirte a su equipo en <strong>AgendaMedPro</strong> como <strong style="color: #0d9488;">${getRoleLabel(role)}</strong>.
              </p>

              <div style="background-color: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="margin: 0; color: #0f766e; font-size: 14px; line-height: 1.5;">
                  <strong>📋 Tu rol:</strong> ${getRoleLabel(role)}<br>
                  <strong>📧 Email invitado:</strong> ${invitedEmail}<br>
                  <strong>👤 Invitado por:</strong> ${ownerEmail}
                </p>
              </div>

              <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                Como ${getRoleLabel(role)}, tendrás acceso a:
              </p>

              ${getRolePermissions(role)}

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}" style="display: inline-block; padding: 16px 32px; background-color: #0d9488; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Aceptar Invitación →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                O copia este enlace en tu navegador:<br>
                <a href="${invitationUrl}" style="color: #0d9488; word-break: break-all;">${invitationUrl}</a>
              </p>

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; line-height: 1.5;">
                  <strong>⚠️ Importante:</strong>
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  <li>Debes registrarte o iniciar sesión con <strong>${invitedEmail}</strong></li>
                  <li>Esta invitación está asociada a tu email</li>
                  <li>Si ya tienes cuenta, inicia sesión primero antes de aceptar</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                AgendaMedPro - Sistema de Gestión Médica
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Si no esperabas este correo, puedes ignorarlo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    doctor: 'Doctor',
    receptionist: 'Recepcionista',
    viewer: 'Solo Lectura'
  };
  return labels[role] || role;
}

function getRolePermissions(role: string): string {
  const permissions: Record<string, string[]> = {
    admin: [
      'Ver y gestionar pacientes',
      'Ver y gestionar citas',
      'Ver y editar expedientes médicos',
      'Ver reportes financieros',
      'Gestionar inventario',
      'Invitar miembros del equipo'
    ],
    doctor: [
      'Ver y gestionar pacientes',
      'Ver y gestionar citas',
      'Ver y editar expedientes médicos',
      'Ver reportes',
      'Ver inventario'
    ],
    receptionist: [
      'Ver y gestionar pacientes',
      'Ver y gestionar citas',
      'Ver expedientes médicos (solo lectura)',
      'Ver reportes básicos'
    ],
    viewer: [
      'Ver pacientes',
      'Ver citas',
      'Ver expedientes',
      'Ver reportes (solo lectura)'
    ]
  };

  const perms = permissions[role] || [];
  
  return `
    <ul style="margin: 0 0 24px; padding-left: 24px; color: #374151; font-size: 15px; line-height: 1.8;">
      ${perms.map(p => `<li>${p}</li>`).join('\n      ')}
    </ul>
  `;
}

export const teamInvitationText = (data: TeamInvitationEmailData) => `
Hola,

${data.ownerName || data.ownerEmail} te ha invitado a unirte a su equipo en AgendaMedPro como ${getRoleLabel(data.role)}.

Para aceptar la invitación, haz clic en el siguiente enlace:
${data.invitationUrl}

Tu rol: ${getRoleLabel(data.role)}
Email invitado: ${data.invitedEmail}
Invitado por: ${data.ownerEmail}

Importante:
- Debes registrarte o iniciar sesión con ${data.invitedEmail}
- Esta invitación está asociada a tu email
- Si ya tienes cuenta, inicia sesión primero antes de aceptar

Si no esperabas este correo, puedes ignorarlo.

--
AgendaMedPro
Sistema de Gestión Médica
`;
