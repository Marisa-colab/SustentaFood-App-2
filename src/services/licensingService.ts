import { supabase } from '../supabaseClient';

export interface LicencaStatus {
  acessoPermitido: boolean;
  motivo?: string;
  organizacaoNome?: string;
}

export async function verificarLicenca(userId: string): Promise<LicencaStatus> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.organization_id) {
      return { 
        acessoPermitido: false, 
        motivo: 'Perfil ou organização não associada.' 
      };
    }

    const { data: org, error: orgError } = await supabase
      .from('organizacoes')
      .select('nome_empresa, status_licenca, valida_ate')
      .eq('id', profile.organization_id)
      .single();

    if (orgError || !org) {
      return { 
        acessoPermitido: false, 
        motivo: 'Dados da subscrição não encontrados.' 
      };
    }

    const dataValidade = new Date(org.valida_ate);
    const hoje = new Date();

    if (org.status_licenca !== 'activa') {
      return { 
        acessoPermitido: false, 
        motivo: 'A subscrição da sua organização encontra-se inativa ou suspensa.' 
      };
    }

    if (dataValidade < hoje) {
      return { 
        acessoPermitido: false, 
        motivo: 'A licença de utilização da plataforma expirou.' 
      };
    }

    return { 
      acessoPermitido: true, 
      organizacaoNome: org.nome_empresa 
    };
  } catch (err) {
    return { 
      acessoPermitido: false, 
      motivo: 'Erro interno ao validar estado da licença.' 
    };
  }
}
