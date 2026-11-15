"use client";

// Full https:// address of the journal on Amazon.
const JOURNAL_URL = "https://www.amazon.com/dp/B0HKZFCG91";

const css = `
.lh{--night:#14213D;--night-deep:#0C1630;--paper:#FBF6EE;--sand:#F1E4D1;--coral:#E07A5F;--ink:#1B2236;--muted:#5E6577;
  font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;color:var(--ink);background:var(--paper);min-height:100vh}
.lh *{box-sizing:border-box}
.lh a,.lh button{font-family:inherit}
.lh .serif{font-family:'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif}
.lh :focus-visible{outline:3px solid #F4B8A5;outline-offset:3px}

.lh-hero{background:var(--night);color:#FBF6EE;position:relative;overflow:hidden}
.lh-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
.lh-nav{display:flex;justify-content:space-between;align-items:center;padding:20px 0}
.lh-logo{display:flex;align-items:center;gap:10px;font-weight:700;font-size:20px;letter-spacing:-.3px}
.lh-logo i{font-style:normal;background:var(--coral);color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800}
.lh-signin{background:transparent;color:#FBF6EE;border:1px solid rgba(251,246,238,.4);border-radius:999px;padding:8px 18px;font-size:14px;font-weight:600;cursor:pointer}
.lh-signin:hover{background:rgba(251,246,238,.1)}

.lh-herogrid{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding:36px 0 64px}
.lh-h1{font-size:clamp(30px,4.2vw,46px);line-height:1.14;letter-spacing:-.8px;font-weight:600;margin:0 0 18px}
.lh-name{color:#EE8F76}
.lh-lead{font-size:18px;line-height:1.65;color:#C9D0E0;max-width:30em;margin:0 0 28px}
.lh-cta{display:inline-flex;align-items:center;gap:12px;background:#FBF6EE;color:var(--night);border:none;border-radius:14px;padding:15px 24px;font-size:16px;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s}
.lh-cta:hover{transform:translateY(-1px);box-shadow:0 10px 28px rgba(0,0,0,.28)}
.lh-note{margin:12px 0 0;font-size:14px;color:#9FA9C2}
.lh-points{list-style:none;padding:0;margin:28px 0 0;display:grid;gap:10px;font-size:15px;color:#DCE2F0}
.lh-points li{display:flex;gap:10px;align-items:flex-start}
.lh-points svg{flex:none;margin-top:3px}
.lh-trust{margin:32px 0 0;font-size:14px;color:#9FA9C2;border-top:1px solid rgba(251,246,238,.14);padding-top:18px;max-width:32em}

.lh-stage{position:relative;display:flex;flex-direction:column;align-items:center}
.lh-stage:before{content:"";position:absolute;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,rgba(224,122,95,.42),rgba(224,122,95,0) 68%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
.lh-phone{position:relative;width:292px;background:var(--night-deep);border-radius:40px;padding:10px;box-shadow:0 40px 80px rgba(0,0,0,.45),inset 0 0 0 1.5px rgba(255,255,255,.12)}
.lh-screen{background:var(--paper);border-radius:31px;overflow:hidden;color:var(--ink)}
.lh-status{display:flex;justify-content:space-between;padding:12px 20px 4px;font-size:12px;font-weight:700;color:#444}
.lh-chead{display:flex;align-items:center;gap:10px;padding:8px 16px 12px;border-bottom:1px solid #EFE4D6}
.lh-av{width:34px;height:34px;border-radius:50%;background:var(--coral);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:15px}
.lh-chead b{display:block;font-size:14px}
.lh-chead span{font-size:12px;color:var(--muted)}
.lh-chat{padding:14px 12px 16px;display:flex;flex-direction:column;gap:10px;min-height:316px}
.lh-b{max-width:86%;font-size:13px;line-height:1.5;padding:10px 13px;border-radius:16px}
.lh-b.u{align-self:flex-end;background:var(--coral);color:#fff;border-bottom-right-radius:5px}
.lh-b.a{align-self:flex-start;background:#fff;border:1px solid #EFE4D6;border-bottom-left-radius:5px}
.lh-input{margin:0 12px 14px;border:1px solid #EADFCF;border-radius:999px;padding:9px 14px;font-size:12px;color:#9a9a9a;background:#fff}
.lh-example{margin:16px 0 0;font-size:12px;color:#9FA9C2;position:relative}

@keyframes lhIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.lh-b.u{animation:lhIn .5s .5s both}
.lh-b.a{animation:lhIn .6s 1.5s both}

.lh-more{padding:64px 0 24px}
.lh-grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.lh-panel{border-radius:24px;padding:32px;display:grid;grid-template-columns:150px 1fr;gap:26px;align-items:center}
.lh-panel h2{font-size:26px;line-height:1.15;margin:0 0 10px;font-weight:600;letter-spacing:-.4px}
.lh-panel p{margin:0 0 18px;font-size:15px;line-height:1.65;color:var(--muted)}
.lh-sheet{background:#fff;border:1px solid #EADFCF}
.lh-journal{background:var(--sand)}
.lh-img{width:100%;height:auto;display:block;border-radius:6px}
.lh-sheet .lh-img{transform:rotate(-3deg);box-shadow:0 14px 30px rgba(60,40,30,.2)}
.lh-journal .lh-img{box-shadow:6px 10px 26px rgba(20,33,61,.35);border-radius:3px 8px 8px 3px}
.lh-btn{display:inline-block;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:700;text-decoration:none;cursor:pointer;border:2px solid var(--night);color:var(--night);background:transparent;transition:background .15s,color .15s}
.lh-btn:hover{background:var(--night);color:#fff}
.lh-small{display:block;margin-top:8px;font-size:13px;color:#8B8F9C}

.lh-foot{max-width:640px;margin:0 auto;padding:36px 24px 44px;text-align:center;font-size:13px;color:#8B8F9C;line-height:1.7}
.lh-foot a{color:#B4573F;text-decoration:none;margin:0 8px}

@media (max-width:860px){
  .lh-herogrid{grid-template-columns:1fr;gap:36px;padding:20px 0 48px}
  .lh-grid2{grid-template-columns:1fr}
  .lh-stage:before{width:340px;height:340px}
}
@media (max-width:560px){
  .lh-panel{grid-template-columns:1fr;gap:20px;padding:24px;justify-items:start}
  .lh-panel .lh-img{width:132px}
  .lh-panel h2{font-size:23px}
  .lh-wrap{padding:0 20px}
}
@media (prefers-reduced-motion:reduce){
  .lh-b.u,.lh-b.a{animation:none}
  .lh-cta{transition:none}
}
`;

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="rgba(224,122,95,.22)" />
      <path d="M5 9.4l2.5 2.5L13 6.4" stroke="#F0A48F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LandingHub({ onGoogle }: { onGoogle: () => void }) {
  return (
    <div className="lh">
      <style>{css}</style>

      {/* Hero */}
      <header className="lh-hero">
        <div className="lh-wrap">
          <nav className="lh-nav" aria-label="Main">
            <div className="lh-logo"><i>N</i>AskNeer</div>
            <button className="lh-signin" onClick={onGoogle}>Sign in</button>
          </nav>

          <div className="lh-herogrid">
            <div>
              <h1 className="lh-h1 serif">3am and baby’s awake? <span className="lh-name">AskNeer</span> has your answer.</h1>
              <p className="lh-lead">
                Search results are written for everyone. Get answers built for your child's age, and an app that remembers what you've told it.
              </p>
              <button className="lh-cta" onClick={onGoogle}>
                <GoogleG /> Continue with Google
              </button>
              <p className="lh-note">Free to start. 3 questions a day, no card needed.</p>

              <ul className="lh-points">
                <li><Check /> Answers built around your child's exact age</li>
                <li><Check /> Remembers allergies, milestones and sleep habits</li>
                <li><Check /> Your child's data is never sold or used for ads</li>
              </ul>

              <p className="lh-trust">Made by NeernMom.</p>
            </div>

            <div className="lh-stage" aria-label="Example AskNeer conversation">
              <div className="lh-phone">
                <div className="lh-screen">
                  <div className="lh-status"><span>3:12 AM</span><span>AskNeer</span></div>
                  <div className="lh-chead">
                    <div className="lh-av">E</div>
                    <div><b>Emma</b><span>8 months old</span></div>
                  </div>
                  <div className="lh-chat">
                    <div className="lh-b u">She woke up crying again. Is this normal at 8 months?</div>
                    <div className="lh-b a">
                      Very common at 8 months, Emma. Night waking often comes with growth spurts, and since she only started solids recently, a hungry tummy can play a part. Keep the lights low and your voice calm. If you're worried, check with your pediatrician.
                    </div>
                  </div>
                  <div className="lh-input">Ask about Emma…</div>
                </div>
              </div>
              <p className="lh-example">Example conversation</p>
            </div>
          </div>
        </div>
      </header>

      {/* Two more things */}
      <main className="lh-wrap lh-more">
        <div className="lh-grid2">
          <section className="lh-panel lh-sheet" aria-labelledby="sheet-h">
            <img className="lh-img" src="/sleep-sheet-preview.jpg" alt="Cover of the free NeernMom baby sleep cheat sheet" width={150} height={225} loading="lazy" />
            <div>
              <h2 id="sheet-h" className="serif">Free baby sleep cheat sheet</h2>
              <p>Why your baby keeps waking at night, and 3 fixes to try tonight. For babies 6 to 18 months. We email it to you.</p>
              <a className="lh-btn" href="/sleep">Get the free PDF</a>
              <span className="lh-small">Just your email.</span>
            </div>
          </section>

          <section className="lh-panel lh-journal" aria-labelledby="journal-h">
            <img className="lh-img" src="/journal-cover.jpg" alt="Cover of The Moments That Made Me Dad, a guided keepsake journal for a baby's first year" width={150} height={225} loading="lazy" />
            <div>
              <h2 id="journal-h" className="serif">The Moments That Made Me Dad</h2>
              <p>A 120-page guided keepsake journal for the first-year moments you never want to forget.</p>
              <a className="lh-btn" href={JOURNAL_URL} target="_blank" rel="noopener noreferrer">See it on Amazon</a>
              <span className="lh-small">Opens Amazon.</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="lh-foot">
        <p style={{ margin: "0 0 10px" }}>
          General parenting guidance only. Not medical advice. For urgent symptoms, contact a healthcare professional.
        </p>
        <p style={{ margin: 0 }}>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/subprocessors">Subprocessors</a>
        </p>
      </footer>
    </div>
  );
}
