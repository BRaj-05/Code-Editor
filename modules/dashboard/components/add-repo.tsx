import {
  Button,
} from "@/components/ui/button";

import {
  ArrowDown,
} from "lucide-react";

import Image from "next/image";

const AddRepo = () => {
  return (
    <div className="group flex cursor-pointer flex-row items-center justify-between rounded-lg border bg-muted px-6 py-6 shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#E93F3F] hover:bg-background hover:shadow-[0_10px_30px_rgba(233,63,63,0.15)]">
      <div className="flex flex-row items-start justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="flex items-center justify-center bg-white transition-colors duration-300 group-hover:border-[#E93F3F] group-hover:bg-[#fff8f8] group-hover:text-[#E93F3F]"
        >
          <ArrowDown
            size={30}
            className="transition-transform duration-300 group-hover:translate-y-1"
          />
        </Button>

        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-[#e93f3f]">
            Open Github Repository
          </h1>

          <p className="max-w-[220px] text-sm text-muted-foreground">
            Work with your repositories in our editor
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <Image
          src="/github.svg"
          alt="Open GitHub repository"
          width={150}
          height={150}
          style={{
            width: "150px",
            height: "auto",
          }}
          className="transition-transform duration-300 group-hover:scale-110"
        />
      </div>
    </div>
  );
};

export default AddRepo;