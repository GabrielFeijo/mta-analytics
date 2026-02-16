import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface Transaction {
    id: number
    type: 'EARN' | 'SPEND' | 'TRANSFER_IN' | 'TRANSFER_OUT'
    amount: number
    source: string
    balance: number
    timestamp: string
    player?: {
        lastUsername: string
    }
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
    if (!transactions || transactions.length === 0) {
        return <div className="text-center py-4 text-muted-foreground">No recent transactions</div>
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {transactions.map((tx) => (
                    <TableRow key={tx.id || Math.random()}>
                        <TableCell className="font-medium">{tx.player?.lastUsername || "Unknown"}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {tx.type === 'EARN' || tx.type === 'TRANSFER_IN' ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                )}
                                <span>{tx.type}</span>
                            </div>
                        </TableCell>
                        <TableCell>{tx.source}</TableCell>
                        <TableCell className={`text-right ${tx.type === 'EARN' || tx.type === 'TRANSFER_IN' ? "text-green-500" : "text-red-500"}`}>
                            {formatCurrency(tx.amount)}
                        </TableCell>
                        <TableCell className="text-right">{new Date(tx.timestamp).toLocaleTimeString()}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
