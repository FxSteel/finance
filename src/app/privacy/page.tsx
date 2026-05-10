export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ink text-paper p-8 max-w-3xl mx-auto">
      <h1 className="text-xl font-medium mb-6">Politica de privacidad</h1>
      <p className="text-steel text-sm mb-4">Ultima actualizacion: Mayo 2026</p>

      <div className="space-y-6 text-sm text-steel leading-relaxed">
        <section>
          <h2 className="text-paper font-medium mb-2">1. Informacion que recopilamos</h2>
          <p>
            Finanza recopila unicamente la informacion necesaria para el funcionamiento de la aplicacion:
            nombre, correo electronico y foto de perfil proporcionados por Google al iniciar sesion.
            Los datos financieros (transacciones, tarjetas, categorias) son ingresados voluntariamente
            por el usuario.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">2. Uso de la informacion</h2>
          <p>
            La informacion recopilada se utiliza exclusivamente para:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Autenticar tu identidad mediante Google OAuth</li>
            <li>Mostrar tu perfil dentro de la aplicacion</li>
            <li>Almacenar y mostrar tus datos financieros personales</li>
          </ul>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">3. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan de forma segura en Supabase con politicas de seguridad
            a nivel de fila (RLS), lo que garantiza que solo tu puedes acceder a tus datos.
            No compartimos, vendemos ni transferimos tu informacion a terceros.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">4. Cookies</h2>
          <p>
            Utilizamos cookies esenciales unicamente para mantener tu sesion activa.
            No utilizamos cookies de rastreo ni publicidad.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">5. Eliminacion de datos</h2>
          <p>
            Puedes solicitar la eliminacion de tu cuenta y todos tus datos en cualquier momento
            contactandonos por correo electronico.
          </p>
        </section>

        <section>
          <h2 className="text-paper font-medium mb-2">6. Contacto</h2>
          <p>
            Para consultas sobre privacidad, contactanos en: stevenharrys25@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}
