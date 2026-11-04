import TicketDetailPage from "@/components/atoms/tickets/TicketDetailPage";

export default function Page({params}) {
    return <TicketDetailPage id={params.id}/>;
}
