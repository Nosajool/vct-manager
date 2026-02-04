// AlertsPanel - Display actionable alerts
//
// Shows alerts computed from game state.
// Each alert can navigate to relevant page/tab or open modals.

import { useGameStore } from '../../store';
import { useAlerts, type Alert } from '../../hooks';

export interface AlertsPanelProps {
  onOpenScrimModal?: (initialMaps?: string[]) => void;
}

export function AlertsPanel({ onOpenScrimModal }: AlertsPanelProps) {
  const setActiveView = useGameStore((state) => state.setActiveView);
  const alerts = useAlerts();

  if (alerts.length === 0) {
    return (
      <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
        <h3 className="text-sm font-semibold text-vct-gray mb-3">Alerts</h3>
        <p className="text-sm text-vct-gray/60 italic">No alerts</p>
      </div>
    );
  }

  const handleAlertClick = (alert: Alert) => {
    if (alert.action) {
      // Handle modal opening
      if (alert.action.openModal === 'scrim' && onOpenScrimModal) {
        const weakMaps = alert.data?.weakMaps as string[] | undefined;
        onOpenScrimModal(weakMaps);
        return;
      }

      setActiveView(alert.action.navigateTo);
      // Note: sub-tab navigation would need additional store support
      // For now, just navigate to the main view
    }
  };

  return (
    <div className="bg-vct-dark rounded-lg border border-vct-gray/20 p-4">
      <h3 className="text-sm font-semibold text-vct-gray mb-3">
        Alerts <span className="text-vct-red">({alerts.length})</span>
      </h3>

      <div className="space-y-2">
        {alerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} onClick={() => handleAlertClick(alert)} />
        ))}
      </div>
    </div>
  );
}

interface AlertItemProps {
  alert: Alert;
  onClick: () => void;
}

function AlertItem({ alert, onClick }: AlertItemProps) {
  const severityStyles = {
    urgent: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20',
  };

  const severityIcons = {
    urgent: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const categoryIcons: Record<string, string> = {
    contract: '📝',
    morale: '😟',
    sponsor: '💼',
    map: '🗺️',
    roster: '👥',
    finance: '💰',
    other: '📋',
  };

  const icon = categoryIcons[alert.category] || severityIcons[alert.severity];

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 border rounded-lg text-left transition-colors ${severityStyles[alert.severity]}`}
    >
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={`font-medium text-sm ${
                alert.severity === 'urgent'
                  ? 'text-red-400'
                  : alert.severity === 'warning'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}
            >
              {alert.title}
            </span>
            {alert.action && (
              <span className="text-xs text-vct-gray/60">{alert.action.label} →</span>
            )}
          </div>
          <p className="text-xs text-vct-gray mt-0.5 truncate">{alert.description}</p>
        </div>
      </div>
    </button>
  );
}
