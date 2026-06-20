export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-14">
      <div className="max-w-lg w-full text-center space-y-6">

        {/* Ikona */}
        <div className="text-6xl mb-2">✨</div>

        {/* Header */}
        <div>
          <p className="text-sm font-semibold tracking-widest text-secondary uppercase mb-2">
            Inspiraise
          </p>
          <h1 className="text-3xl font-black text-primary mb-4">
            Díky za nákup!
          </h1>
          <p className="text-primary/70 text-lg leading-relaxed">
            Za chvíli ti přijde email s přístupovým odkazem.
          </p>
        </div>

        {/* Karta s info */}
        <div className="card p-8 text-left space-y-5">
          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">📧</span>
            <div>
              <p className="font-semibold text-primary mb-1">Zkontroluj email</p>
              <p className="text-primary/70 text-sm leading-relaxed">
                Odkaz pro zahájení diagnostiky dorazí na tvůj email do pár minut.
                Zkontroluj i složku spam, kdyby tam zapadl.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">⏱</span>
            <div>
              <p className="font-semibold text-primary mb-1">Vyhraď si 45–60 minut</p>
              <p className="text-primary/70 text-sm leading-relaxed">
                Diagnostiku doporučuji dělat v klidu, bez rušení.
                Nejlepší výsledky přichází, když si na ni vyhradíš čas jako na důležitou schůzku.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <span className="text-2xl flex-shrink-0">🎙</span>
            <div>
              <p className="font-semibold text-primary mb-1">Tip: diktování místo psaní</p>
              <p className="text-primary/70 text-sm leading-relaxed">
                Mluveným slovem to půjde přirozeněji. Zkus appku{' '}
                <a
                  href="https://wisprflow.ai/r?LENKA74"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary underline underline-offset-2"
                >
                  Wispr Flow
                </a>{' '}
                — 30 dní zdarma.
              </p>
            </div>
          </div>
        </div>

        {/* Odkaz na inspiraise */}
        <p className="text-primary/50 text-sm">
          Otázky? Napiš na{' '}
          <a
            href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'lenka.pechrova@inspiraise.com'}`}
            className="text-secondary underline underline-offset-2"
          >
            {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'lenka.pechrova@inspiraise.com'}
          </a>
        </p>

        <footer className="text-xs text-primary/30 pt-4">
          © {new Date().getFullYear()} Inspiraise s.r.o.
        </footer>
      </div>
    </div>
  )
}
