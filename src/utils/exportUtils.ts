import type { ProductionRegistryEntry, DeliveryItem, DailyStatus, LeaveEntry } from '../services/mockData';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-https or older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

export function exportBranchMatrixToSlack(entries: ProductionRegistryEntry[]): string {
  const regions = ['AE', 'SA', 'IN', 'KW', 'QA', 'UK'];
  const projects = Array.from(new Set(entries.map(e => e.project)));
  
  let report = `🚀 *OpsPortal Live Branch Status Report*\n`;
  report += `_Generated on: ${new Date().toLocaleString()}_\n\n`;

  if (projects.length === 0) {
    return report + `_No live branch data logged._`;
  }

  projects.forEach(project => {
    report += `*📦 Project: ${project}*\n`;
    const projEntries = entries.filter(e => e.project === project);
    regions.forEach(region => {
      const match = projEntries.find(e => e.region === region);
      const branch = match ? `\`${match.version}\`` : '`-`';
      const updated = match ? ` (${match.updatedDate})` : '';
      report += `  • *${region}*: ${branch}${updated}\n`;
    });
    report += `\n`;
  });

  return report;
}

export function exportDeliveryStandupToSlack(items: DeliveryItem[]): string {
  let report = `📋 *OpsPortal Delivery & Incident Standup*\n`;
  report += `_Date: ${new Date().toISOString().split('T')[0]}_\n\n`;

  if (items.length === 0) {
    return report + `_No active delivery tasks._`;
  }

  const groupedByStatus: Record<string, DeliveryItem[]> = {};
  items.forEach(item => {
    groupedByStatus[item.status] = groupedByStatus[item.status] || [];
    groupedByStatus[item.status].push(item);
  });

  const statusOrder: DeliveryItem['status'][] = ['Ready for Live', 'In Progress', 'UAT', 'Open', 'On Hold', 'Completed'];

  statusOrder.forEach(status => {
    const group = groupedByStatus[status];
    if (group && group.length > 0) {
      report += `*${status.toUpperCase()}* (${group.length}):\n`;
      group.forEach(item => {
        const liveUpdates = item.liveUpdates ? Object.entries(item.liveUpdates)
          .map(([reg, envs]) => `${reg}: [${envs.join(', ')}]`)
          .join(' | ') : '';
        const envStr = liveUpdates ? ` → _${liveUpdates}_` : '';
        report += `  • *[${item.jiraId}]* ${item.taskName} — _@${item.resource}_${envStr}\n`;
      });
      report += `\n`;
    }
  });

  return report;
}

export function exportDailyStatusToSlack(statuses: DailyStatus[], leaves: LeaveEntry[] = []): string {
  const todayStr = new Date().toISOString().split('T')[0];
  let report = `☀️ *Daily Team Focus Digest (${todayStr})*\n\n`;

  const todayLeaves = leaves.filter(l => todayStr >= l.startDate && todayStr <= l.endDate);

  if (todayLeaves.length > 0) {
    report += `🏖️ *Team Members on Leave Today*:\n`;
    todayLeaves.forEach(l => {
      report += `  • *${l.resource}* (${l.leaveType} Leave)\n`;
    });
    report += `\n`;
  }

  report += `🎯 *Team Daily Focus*:\n`;
  if (statuses.length === 0) {
    report += `  _No daily status logged for today yet._\n`;
  } else {
    statuses.forEach(s => {
      report += `  • *${s.resource}*: ${s.focus}${s.remarks ? ` _(${s.remarks})_` : ''}\n`;
    });
  }

  return report;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
