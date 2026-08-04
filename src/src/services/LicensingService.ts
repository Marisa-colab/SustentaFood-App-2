import { supabase } from '../supabaseClient'; // Ajusta o caminho do teu cliente Supabase

export interface LicencaStatus {
  acessoPermitido: boolean;
  motivo?: string;
  dataValidade?: string;
}

export async function verificarLicenca(userId: string): Promise<LicencaStatus> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select(`
      organization_id,
      organizacoes (
        status_licenca,
        valida_ate
      )
    `)
    .eq('id', userId)
    .single();

  if (error || !profile?.organizacoes) {
    return { acessoPermitido: false, motivo: 'Licença ou organização não encontrada.' };
  }

  const licenca = profile.organizacoes as unknown as { status_licenca: string; valida_ate: string };
  const hoje = new Date();
  const dataValidade = new Date(licenca.valida_ate);

  if (licenca.status_licenca !== 'activa') {
    return { acessoPermitido: false, motivo: 'A licença desta conta encontra-se inativa ou suspensa.' };
  }

  if (hoje > dataValidade) {
    return { acessoPermitido: false, motivo: `A sua licença expirou a ${dataValidade.toLocaleDateString('pt-PT')}.` };
  }

  return { acessoPermitido: true, dataValidade: licenca.valida_ate };
}
