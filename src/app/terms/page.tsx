export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink text-paper p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-medium mb-6">Condiciones del servicio</h1>
      <p className="text-steel text-sm mb-4">Ultima actualizacion: Mayo 2026</p>

      <div className="space-y-6 text-sm text-steel leading-relaxed">
        <section>
          <h2 className="text-paper font-medium mb-2">1. Aceptacion de los terminos</h2>
          <p>
            Al acceder y utilizar Finanza, aceptas estas condiciones de servicio.
            Si no estas de acuerdo, no utilices la aplicacion.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">2. Descripcion del servicio</h2>
          <p>
            Finanza es una herramienta de gestion de finanzas personales que permite
            registrar ingresos, egresos, tarjetas de credito y cuotas. Es una aplicacion
            de uso personal y no constituye asesoria financiera.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">3. Cuentas de usuario</h2>
          <p>
            El acceso se realiza mediante autenticacion de Google. Eres responsable de
            mantener la seguridad de tu cuenta de Google. Cada usuario es responsable
            de la precision de los datos que ingresa.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">4. Uso aceptable</h2>
          <p>
            Te comprometes a utilizar Finanza unicamente para fines personales y legales.
            No esta permitido intentar acceder a datos de otros usuarios ni interferir
            con el funcionamiento de la aplicacion.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">5. Limitacion de responsabilidad</h2>
          <p>
            Finanza se proporciona &quot;tal cual&quot;. No garantizamos que el servicio sea
            ininterrumpido o libre de errores. No somos responsables de decisiones
            financieras tomadas basandose en la informacion mostrada en la aplicacion.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">6. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estas condiciones en cualquier momento.
            Los cambios seran efectivos al publicarse en esta pagina.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">7. Contacto</h2>
          <p>
            Para consultas sobre estos terminos, contactanos en: stevenharrys25@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
