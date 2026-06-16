import { useMarsWeather, useMarsWeatherHistory } from '@/hooks/useMarsWeather';
import { useOnlineStatus } from '@/hooks/usePWAStatus';
import { MarsWindHero } from '@/components/immersive/MarsWindHero';
import { CinematicLoader } from '@/components/immersive/CinematicLoader';
import { WeatherCards } from './WeatherCards';
import { TemperatureChart } from './TemperatureChart';
import { RoverStatusGrid } from './RoverStatusGrid';
import { OfflineScreen } from '@/components/common/OfflineScreen';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/Badge';
import { isNetworkError } from '@/services/api';
import { formatSol } from '@/utils/solConverter';

export function DashboardPage() {
  const isOnline = useOnlineStatus();
  const { data: weather, isLoading, isError, error, refetch, isFetching } = useMarsWeather();
  const { data: history, isLoading: historyLoading } = useMarsWeatherHistory(7);

  if (isLoading) {
    return <CinematicLoader label="Recebendo telemetria de Elysium Planitia..." />;
  }

  if (isError && !weather) {
    const offline = !isOnline || isNetworkError(error);
    return (
      <OfflineScreen
        title={offline ? 'Telemetria indisponível offline' : 'Erro ao carregar telemetria'}
        message={
          offline
            ? 'Os dados climáticos ainda não foram salvos localmente. Conecte-se para sincronizar.'
            : 'Não foi possível obter dados do InSight. Tente novamente em instantes.'
        }
        onRetry={() => refetch()}
      />
    );
  }

  if (!weather) return null;

  return (
    <div className="space-y-10 sm:space-y-12">
      <MarsWindHero weather={weather} />

      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-[10px] font-mono text-content-subtle uppercase tracking-widest">
          Telemetria · {formatSol(weather.sol)}
        </p>
        <Badge variant="active">{isFetching ? 'Ao vivo' : 'Cache'}</Badge>
      </div>

      <section className="stagger-children">
        <SectionTitle
          title="Condições ambientais"
          subtitle="Último registro InSight — missão encerrada em 2022"
          trailing={<Badge variant="active">InSight</Badge>}
        />
        <WeatherCards weather={weather} />
      </section>

      <section>
        {historyLoading ? (
          <div className="py-8 text-center text-xs font-mono text-content-subtle animate-pulse">
            CALCULANDO TENDÊNCIA TÉRMICA...
          </div>
        ) : history && history.length > 0 ? (
          <TemperatureChart history={history} />
        ) : null}
      </section>

      <section className="stagger-children">
        <SectionTitle
          title="Veículos em solo marciano"
          subtitle="Selecione um rover para ver a superfície pelos olhos dele"
        />
        <RoverStatusGrid />
      </section>
    </div>
  );
}
