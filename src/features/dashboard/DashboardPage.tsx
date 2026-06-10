import { Link } from 'react-router-dom';
import { useMarsWeather, useMarsWeatherHistory } from '@/hooks/useMarsWeather';
import { useOnlineStatus } from '@/hooks/usePWAStatus';
import { WeatherCards } from './WeatherCards';
import { TemperatureChart } from './TemperatureChart';
import { RoverStatusGrid } from './RoverStatusGrid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OfflineScreen } from '@/components/common/OfflineScreen';
import { PageHeader } from '@/components/ui/PageHeader';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { isNetworkError } from '@/services/api';
import { formatSol } from '@/utils/solConverter';

export function DashboardPage() {
  const isOnline = useOnlineStatus();
  const { data: weather, isLoading, isError, error, refetch, isFetching } = useMarsWeather();
  const { data: history, isLoading: historyLoading } = useMarsWeatherHistory(7);

  if (isLoading) {
    return <LoadingSpinner label="Sincronizando telemetria de Marte..." />;
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
    <div className="space-y-10 animate-fade-in">
      <PageHeader
        title="Centro de Comando"
        description="Painel de telemetria marciana — clima histórico do InSight e status dos veículos exploradores."
        badge={
          <Badge variant="active">
            {isFetching ? 'Sincronizando…' : 'Cache ativo'}
          </Badge>
        }
        action={
          <Link to="/gallery">
            <Button variant="secondary" size="sm">
              Abrir galeria
            </Button>
          </Link>
        }
      />

      <InfoBanner variant="info" title="Sobre os dados de clima">
        Medidos pelo lander <strong>InSight</strong> em Elysium Planitia. A missão encerrou em 2022 —
        os valores são o <strong>último registro disponível</strong> ({formatSol(weather.sol)}), não o
        clima ao vivo de hoje.
      </InfoBanner>

      <section>
        <SectionTitle
          title="Condições ambientais"
          subtitle="Temperatura, pressão e vento na superfície marciana"
          trailing={<Badge variant="active">InSight</Badge>}
        />
        <WeatherCards weather={weather} />
      </section>

      <section>
        {historyLoading ? (
          <LoadingSpinner size="sm" label="Carregando histórico..." />
        ) : history && history.length > 0 ? (
          <TemperatureChart history={history} />
        ) : null}
      </section>

      <section>
        <SectionTitle
          title="Veículos exploradores"
          subtitle="Toque em um rover para ver suas fotos na galeria"
        />
        <RoverStatusGrid />
      </section>
    </div>
  );
}
