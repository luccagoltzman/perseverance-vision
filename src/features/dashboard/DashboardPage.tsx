import { useMarsWeather, useMarsWeatherHistory } from '@/hooks/useMarsWeather';
import { useOnlineStatus } from '@/hooks/usePWAStatus';
import { WeatherCards } from './WeatherCards';
import { TemperatureChart } from './TemperatureChart';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OfflineScreen } from '@/components/common/OfflineScreen';
import { isNetworkError } from '@/services/api';
import { ROVER_LIST } from '@/utils/roverCameras';
import { getCurrentSol } from '@/utils/solConverter';
import { Badge } from '@/components/ui/Badge';

export function DashboardPage() {
  const isOnline = useOnlineStatus();
  const { data: weather, isLoading, isError, error, refetch, isFetching } = useMarsWeather();
  const { data: history, isLoading: historyLoading } = useMarsWeatherHistory(7);

  if (isLoading) {
    return <LoadingSpinner label="Sincronizando telemetria de Marte..." />;
  }

  if (isError && !weather) {
    const offline = !isOnline || isNetworkError(error);
    if (offline) {
      return (
        <OfflineScreen
          title="Telemetria indisponível offline"
          message="Os dados climáticos deste Sol ainda não foram salvos localmente. Conecte-se para sincronizar."
          onRetry={() => refetch()}
        />
      );
    }
    return (
      <OfflineScreen
        title="Erro ao carregar telemetria"
        message="Não foi possível obter dados do InSight. Tente novamente em instantes."
        onRetry={() => refetch()}
      />
    );
  }

  if (!weather) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl text-white tracking-wide">
              Condições Ambientais
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Dados do lander InSight — última atualização{' '}
              {isFetching ? '(sincronizando...)' : '(cache ativo)'}
            </p>
          </div>
          <Badge variant="active">InSight · Elysium Planitia</Badge>
        </div>
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
        <h2 className="font-display text-lg text-white mb-4 tracking-wide">
          Status dos Veículos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROVER_LIST.map((rover) => (
            <div
              key={rover.name}
              className="bg-space-800/40 border border-space-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-sm text-white">{rover.label}</span>
                <Badge variant={rover.status === 'active' ? 'active' : 'inactive'}>
                  {rover.status === 'active' ? 'Ativo' : 'Concluído'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Sol atual: {getCurrentSol(rover.name).toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Pouso: {new Date(rover.landingDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
