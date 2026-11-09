(() => {
  const button = document.querySelector('.login-reveal');
  const input = document.getElementById('password');
  if (!button || !input) return;

  button.hidden = false;
  button.addEventListener('click', () => {
    const visible = input.type === 'password';
    input.type = visible ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', visible ? 'Şifreyi gizle' : 'Şifreyi göster');
  });
})();
