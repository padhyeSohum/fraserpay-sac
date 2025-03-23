
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

export interface BoothLeaderboardProps {
  leaderboard: any[];
}

const BoothLeaderboard: React.FC<BoothLeaderboardProps> = ({ 
  leaderboard = []
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Booths</CardTitle>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No booth data available
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booth</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((booth, index) => (
                <TableRow key={booth.id}>
                  <TableCell className="font-medium">
                    {index < 3 && (
                      <span className="mr-2">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    )}
                    {booth.name}
                  </TableCell>
                  <TableCell>{booth.sales || 0}</TableCell>
                  <TableCell className="text-right">${booth.revenue?.toFixed(2) || '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BoothLeaderboard;
