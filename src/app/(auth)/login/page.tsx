import { login, signup } from './actions'

function RunwayLogo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="12" fill="#3B424E"/>
      <path d="M20 8L20 32" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 14L20 8L28 14" stroke="#B0B9D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 26L20 22L32 26" stroke="#AAB5C5" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 31L20 28L34 31" stroke="#8991B2" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div style={{ minHeight: '100dvh', background: 'white', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 430, display: 'flex', flexDirection: 'column' }}>
        <div className="auth-hero">
          <RunwayLogo size={52}/>
          <h1 className="auth-title">Runway Tracker</h1>
          <p className="auth-sub">런던 생활비 런웨이 트래커</p>
        </div>
        <form className="auth-form">
          <div className="field-group">
            <label className="field-label" htmlFor="email">이메일</label>
            <input className="field-input" id="email" name="email" type="email"
              placeholder="hello@example.com" required/>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="password">비밀번호</label>
            <input className="field-input" id="password" name="password" type="password"
              placeholder="••••••••" required/>
          </div>
          <button className="btn-primary" style={{ marginTop: 8 }} formAction={login}>
            로그인
          </button>
          <p className="auth-switch">
            계정이 없으신가요?{' '}
            <button className="auth-link" style={{ background: 'none', border: 'none', padding: 0 }} formAction={signup}>
              회원가입
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
