import { LoginButton } from "./login-button";

const ERROR_MESSAGES: Record<string, string> = {
  denied: "このアカウントには利用権限がありません。",
  auth: "ログインに失敗しました。もう一度お試しください。",
};

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await props.searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-xl bg-canvas px-lg">
      <div className="flex flex-col items-center gap-sm">
        <h1 className="text-display-lg font-light tracking-wordmark text-on-dark">
          KATARIBE
        </h1>
        <p className="text-caption-md text-mute-dark">
          カタリベ — あなただけの語り部
        </p>
      </div>
      <LoginButton />
      {errorMessage && (
        <p role="alert" className="text-caption-md text-warning">
          {errorMessage}
        </p>
      )}
    </main>
  );
}
