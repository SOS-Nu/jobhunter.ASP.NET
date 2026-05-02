import { getUsersConnected } from "@/config/api";
import { useAppSelector } from "@/redux/hooks";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";

export const useUsersConnected = () => {
  const user = useAppSelector((state) => state?.account.user);

  const {
    data: res,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ["usersConnected"],
    queryFn: () => getUsersConnected(+user?.id),
    enabled: !!user?.id,
    staleTime: 10 * 1000,
    refetchOnWindowFocus: true,
  });

  return { res, isLoading, isFetching, error, refetch };
};
