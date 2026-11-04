import { icon } from "../components/icons.js";

export function loginPage(notice = "") {
  const noticeMarkup = notice
    ? `<div class="login-message is-info" role="status">${escapeHtml(notice)}</div>`
    : "";
  return `
    <main class="login-page">
      <section class="login-showcase" aria-label="IronCore Gym Management">
        <a class="login-brand" href="#/login" aria-label="IronCore sign in">
          <span class="brand-mark">${icon("activity")}</span>
          <span class="brand-name">iron<span>core</span><small>GYM MANAGEMENT</small></span>
        </a>
        <div class="showcase-copy">
          <span class="showcase-kicker"><span></span> BUILT FOR YOUR NEXT REP</span>
          <h1>Better together.<br />Stronger <em>every day.</em></h1>
          <p>Your gym workspace brings the people, plans, and progress behind every goal into one place.</p>
        </div>
        <div class="showcase-art" aria-hidden="true">
          <div class="showcase-ring ring-outer"></div><div class="showcase-ring ring-middle"></div><div class="showcase-ring ring-inner"></div>
          <div class="showcase-dumbbell">${icon("dumbbell")}</div><span class="showcase-star star-a">✦</span><span class="showcase-star star-b">✦</span>
        </div>
        <div class="showcase-footer"><span>IRONCORE WORKSPACE</span><span>MOVE WITH PURPOSE</span></div>
      </section>
      <section class="login-panel" aria-labelledby="login-title">
        <div class="login-panel-inner">
          <div class="mobile-login-brand"><span class="brand-mark">${icon("activity")}</span><span class="brand-name">iron<span>core</span><small>GYM MANAGEMENT</small></span></div>
          <div class="login-heading"><span class="login-eyebrow">WELCOME BACK</span><h2 id="login-title">Sign in to your workspace</h2><p>Enter your account details to continue.</p></div>
          ${noticeMarkup}
          <form class="login-form" id="login-form" novalidate>
            <div class="form-field" data-field="email">
              <label for="login-email">Email address</label>
              <div class="input-wrap">${icon("user")}<input id="login-email" name="email" type="email" autocomplete="username" placeholder="you@example.com" required aria-describedby="email-error" /></div>
              <span class="field-error" id="email-error" aria-live="polite"></span>
            </div>
            <div class="form-field" data-field="password">
              <div class="label-row"><label for="login-password">Password</label></div>
              <div class="input-wrap">${icon("badge")}<input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" required aria-describedby="password-error" /><button class="password-toggle" type="button" data-action="toggle-password" aria-label="Show password" aria-pressed="false">${icon("eye")}</button></div>
              <span class="field-error" id="password-error" aria-live="polite"></span>
            </div>
            <div class="login-message" id="login-message" role="status" aria-live="polite"></div>
            <button class="login-submit" type="submit"><span class="submit-label">Sign in</span><span class="submit-spinner" aria-hidden="true"></span>${icon("arrow")}</button>
          </form>
          <div class="login-footnote"><span class="secure-mark">${icon("badge")}</span><span>Your workspace is for authorized gym members and staff.</span></div>
        </div>
        <div class="login-copyright">© ${new Date().getFullYear()} IronCore Gym Management</div>
      </section>
    </main>`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
