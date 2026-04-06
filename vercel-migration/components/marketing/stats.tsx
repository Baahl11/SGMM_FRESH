export function MomentumStats() {
  const stats = [
    {
      label: 'Reducción de inasistencias',
      value: '-78%',
      detail: 'Con anticipos online y recordatorios automáticos por WhatsApp',
    },
    {
      label: 'Horas administrativas ahorradas',
      value: '18 h/sem',
      detail: 'Sin llamadas de confirmación ni seguimiento manual',
    },
    {
      label: 'Aumento en facturación anual',
      value: '+120%',
      detail: 'Citas llenas, lista de espera activa y cobros automatizados',
    },
  ]

  return (
    <section className="bg-[#030614] pb-12">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-[32px] border border-white/5 bg-white/[0.02] px-6 py-10 text-white shadow-[0_30px_120px_rgba(3,6,20,0.8)] md:grid-cols-3">
        {stats.map((item) => (
          <div key={item.label} className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">{item.label}</p>
            <p className="text-2xl font-semibold text-white">{item.value}</p>
            <p className="text-sm text-white/65">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
