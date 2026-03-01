const AppHeader = ({
  copy,
  language,
  theme,
  onResetAllInputs,
  onToggleLanguage,
  onToggleTheme,
}) => (
  <header className="app-header card">
    <div className="header-row">
      <h1>{copy.appTitle}</h1>
      <div className="header-actions">
        <button type="button" className="theme-toggle" onClick={onResetAllInputs}>
          {copy.resetAllInputs}
        </button>
        <button type="button" className="theme-toggle" onClick={onToggleLanguage}>
          {language === 'en' ? copy.switchToRussian : copy.switchToEnglish}
        </button>
        <button type="button" className="theme-toggle" onClick={onToggleTheme}>
          {theme === 'dark' ? copy.switchToLight : copy.switchToDark}
        </button>
      </div>
    </div>
    <p>{copy.appSubtitle}</p>
    <section className="app-instructions" aria-label={copy.instructionsAria}>
      <p className="app-instructions-description">{copy.instructionsDescription}</p>
      <h2>{copy.howToUse}</h2>
      <ol>
        {copy.howToUseSteps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  </header>
);

export default AppHeader;
