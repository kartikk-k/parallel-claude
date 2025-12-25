/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface colors - for backgrounds with glass morphism
        surface: {
          base: 'var(--surface-base)',
          raised: 'var(--surface-raised)',
          overlay: 'var(--surface-overlay)',
          elevated: 'var(--surface-elevated)',
          sunken: 'var(--surface-sunken)',
          'sunken-deep': 'var(--surface-sunken-deep)',
        },
        // Border colors
        border: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
          focus: 'var(--border-focus)',
        },
        // Text colors
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
          faint: 'var(--text-faint)',
        },
        // Status colors
        status: {
          modified: 'var(--status-modified)',
          added: 'var(--status-added)',
          deleted: 'var(--status-deleted)',
        },
        // Button colors
        btn: {
          primary: 'var(--btn-primary)',
          'primary-hover': 'var(--btn-primary-hover)',
          success: 'var(--btn-success)',
          'success-hover': 'var(--btn-success-hover)',
          danger: 'var(--btn-danger)',
          'danger-hover': 'var(--btn-danger-hover)',
          disabled: 'var(--btn-disabled)',
          'disabled-text': 'var(--btn-disabled-text)',
        },
        // Alert colors
        alert: {
          'error-bg': 'var(--alert-error-bg)',
          'error-border': 'var(--alert-error-border)',
          'error-text': 'var(--alert-error-text)',
        },
        // Dropzone colors
        dropzone: {
          'active-bg': 'var(--dropzone-active-bg)',
          'active-border': 'var(--dropzone-active-border)',
        },
      },
      borderColor: {
        DEFAULT: 'var(--border-default)',
      },
    },
  },
  plugins: [],
}
