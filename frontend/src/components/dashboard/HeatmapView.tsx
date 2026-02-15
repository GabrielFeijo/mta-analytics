import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef } from 'react';

export function HeatmapView() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const mapImageRef = useRef<HTMLImageElement | null>(null);

	const { data: heatmapData, isLoading } = useQuery({
		queryKey: ['player-heatmap'],
		queryFn: () =>
			analyticsApi.getHeatmapData({
				eventType: 'player_position',
				startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
				endDate: new Date(),
			}),
		refetchInterval: 60000,
	});

	useEffect(() => {
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = 'https://i.imgur.com/bo8rIDL.png';
		img.onload = () => {
			mapImageRef.current = img;
			drawHeatmap();
		};
	}, []);

	const drawHeatmap = () => {
		const canvas = canvasRef.current;
		if (!canvas || !heatmapData) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (mapImageRef.current) {
			ctx.drawImage(mapImageRef.current, 0, 0, canvas.width, canvas.height);
		} else {
			ctx.fillStyle = '#1e293b';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		const scale = canvas.width / 6000;

		heatmapData.forEach((point: any) => {
			const x = (point.x + 3000) * scale;
			const y = (3000 - point.y) * scale;

			const radius = 20;
			const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
			gradient.addColorStop(
				0,
				`rgba(255, 50, 0, ${Math.min(point.intensity + 0.3, 1)})`,
			);
			gradient.addColorStop(0.5, `rgba(255, 150, 0, ${point.intensity * 0.4})`);
			gradient.addColorStop(1, 'rgba(255, 200, 0, 0)');

			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, Math.PI * 2);
			ctx.fill();
		});
	};

	useEffect(() => {
		drawHeatmap();
	}, [heatmapData]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Player Density Heatmap</CardTitle>
			</CardHeader>
			<CardContent className='flex justify-center'>
				{isLoading ? (
					<div className='h-[500px] flex items-center justify-center'>
						Loading heatmap...
					</div>
				) : (
					<div
						className='relative border rounded-lg bg-slate-900 overflow-hidden'
						style={{ width: '500px', height: '500px' }}
					>
						<canvas
							ref={canvasRef}
							width={500}
							height={500}
							className='absolute inset-0'
						/>
						<div className='absolute bottom-2 right-2 text-xs text-muted-foreground bg-black/50 p-1 rounded'>
							MTA World Coordinate Map (-3000 to 3000)
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
