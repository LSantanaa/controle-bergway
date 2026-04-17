type FlashMessageProps = {
  error?: string;
  success?: string;
};

export function FlashMessage({ error, success }: FlashMessageProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <div className={error ? "flash flash-error" : "flash flash-success"}>
      {error || success}
    </div>
  );
}
