import { Spinner } from "./spinner";

interface ButtonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
}

export function ButtonLoader({
  isLoading,
  children,
  loadingText,
}: ButtonLoaderProps) {
  return (
    <>
      {isLoading && <Spinner className="size-4" />}
      {isLoading ? loadingText || "Carregando..." : children}
    </>
  );
}
