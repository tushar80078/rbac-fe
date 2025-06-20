import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import GeneratedAvatar from "@/components/generated-avatar";
import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
// import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import useUserDetails from "@/hooks/useUserDetails";
import { useDispatch } from "react-redux";
import { logOutUser } from "@/redux/slice/auth.slice";
import { useNavigate } from "react-router-dom";

const DashboardUserButton = () => {
  //   const { data, isPending } = authClient.useSession();
  //   const router = useRouter();
  const { data } = useUserDetails();
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onLogout = async () => {
    dispatch(logOutUser());
    localStorage.removeItem("persist:root");
    navigate("/");
  };

  //   if (!data || isPending) {
  //     return null;
  //   }

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2 ">
          <GeneratedAvatar
            seed={data?.username}
            variant="botttsNeutral"
            className="size-9 mr-3"
          />
          <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
            <p className="text-sm truncate w-full">{data?.username}</p>
            <p className="text-xs truncate w-full">{data?.email}</p>
          </div>
          <ChevronDownIcon className="size-4 shrink-0" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{data?.username}</DrawerTitle>
            <DrawerDescription>{data?.email}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant={"outline"} onClick={() => onLogout()}>
              <LogOutIcon className="text-black size-4" />
              Logout
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-lg border border-border/10 p-3 w-full flex items-center justify-between bg-white/5 hover:bg-white/10 overflow-hidden gap-x-2 ">
        <GeneratedAvatar
          seed={data?.username}
          variant="botttsNeutral"
          className="size-9 mr-3"
        />
        <div className="flex flex-col gap-0.5 text-left overflow-hidden flex-1 min-w-0">
          <p className="text-sm truncate w-full">{data?.username}</p>
          <p className="text-xs truncate w-full">{data?.email}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium truncate">{data?.username}</span>
            <span className="text-sm font-normal text-muted-foreground truncate">
              {data?.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-between"
          onClick={() => onLogout()}
        >
          Logout <LogOutIcon className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DashboardUserButton;
