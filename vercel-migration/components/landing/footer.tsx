"use client";

import { Calendar, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = {
  product: [
    { label: "Funcionalidades", href: "/#features" },
    { label: "Precios", href: "/#pricing" },
    { label: "Testimonios", href: "/testimonios" },
    { label: "Casos de éxito", href: "/casos-exito" },
  ],
  company: [
    { label: "Acerca de", href: "/acerca-de" },
    { label: "Blog", href: "/blog" },
    { label: "Soporte técnico", href: "/soporte" },
    { label: "Datos en México", href: "/datos-mexico" },
  ],
  resources: [
    { label: "Documentación", href: "/documentacion" },
    { label: "Guías", href: "/guias" },
    { label: "Estado del sistema", href: "/estado-sistema" },
  ],
  legal: [
    { label: "Privacidad", href: "/privacidad" },
    { label: "Términos y Condiciones", href: "/terminos" },
    { label: "Cookies", href: "/cookies" },
    { label: "Aviso legal", href: "/aviso-legal" },
  ]
};

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/agendamedpro", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/agendamedpro", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/agendamedpro", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/agendamedpro", label: "LinkedIn" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-slate-900 text-slate-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AgendaMedPro</span>
            </div>
            
            <p className="text-slate-400 mb-6 leading-relaxed max-w-sm">
              La plataforma de gestión médica más completa de México. Ahorra tiempo, aumenta eficiencia, mejora la experiencia de tus pacientes.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a href="mailto:contacto@agendamedpro.com" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
                <span className="text-sm">contacto@agendamedpro.com</span>
              </a>
              <a href="https://wa.me/522223404585" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+52 2223 404585</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">Puebla, México</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Producto</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Compañía</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Recursos</h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.href} 
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400" suppressHydrationWarning>
              © {currentYear} AgendaMedPro. Todos los derechos reservados.
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Todos los sistemas operativos
              </span>
              <span>🇲🇽 Hecho con ❤️ en México</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
    </footer>
  );
}
