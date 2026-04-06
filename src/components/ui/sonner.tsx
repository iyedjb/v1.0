import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-4 group-[.toaster]:border-black group-[.toaster]:rounded-none group-[.toaster]:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-[.toaster]:font-black group-[.toaster]:uppercase group-[.toaster]:tracking-tight",
          description: "group-[.toast]:text-black/60 group-[.toast]:font-bold group-[.toast]:normal-case group-[.toast]:tracking-normal",
          actionButton: "group-[.toast]:bg-yellow-500 group-[.toast]:text-black group-[.toast]:rounded-none group-[.toast]:font-black",
          cancelButton: "group-[.toast]:bg-black/10 group-[.toast]:text-black group-[.toast]:rounded-none group-[.toast]:font-black",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
