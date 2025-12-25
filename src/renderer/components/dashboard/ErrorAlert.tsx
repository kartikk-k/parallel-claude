interface ErrorAlertProps {
  message: string | null;
}

export default function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-alert-error-bg border border-alert-error-border rounded-lg text-alert-error-text">
      {message}
    </div>
  );
}
