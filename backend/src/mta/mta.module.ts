import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MtaController } from './mta.controller';
import { MtaService } from './mta.service';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'events',
        }),
    ],
    controllers: [MtaController],
    providers: [MtaService],
    exports: [MtaService],
})
export class MtaModule { }
