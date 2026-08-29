import { supabase } from '../supabaseClient';

export interface LicencaStatus {
  acessoPermitido: boolean;
  motivo?: string;
  dataInicio?: string;
  dataValidade?: string;
  superAdmin?: boolean;
}

interface OrganizacaoLicenca {
  id: string;
  nome: string | null;
  status_licenca: string | null;
  inicio_licenca: string | null;
  valida_ate: string | null;
}

export async function verificarLicenca(
  userId: string
): Promise<LicencaStatus> {
  try {
    const [
      { data: profile, error: profileError },
      { data: isSuperAdmin, error: adminError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          organizacao_id,
          organizacoes (
            id,
            nome,
            status_licenca,
            inicio_licenca,
            valida_ate
          )
        `)
        .eq('id', userId)
        .single(),

      supabase.rpc('is_super_admin'),
    ]);

    if (adminError) {
      console.error(
        'Erro ao verificar a superadministradora:',
        adminError
      );

      return {
        acessoPermitido: false,
        motivo: 'Não foi possível validar as permissões da conta.',
      };
    }

    // A superadministradora não fica limitada pela licença
    // da organização associada ao seu perfil.
    if (isSuperAdmin === true) {
      return {
        acessoPermitido: true,
        superAdmin: true,
      };
    }

    if (profileError) {
      console.error('Erro ao carregar o perfil:', profileError);

      return {
        acessoPermitido: false,
        motivo: 'Não foi possível encontrar o perfil do utilizador.',
      };
    }

    if (!profile?.organizacao_id) {
      return {
        acessoPermitido: false,
        motivo: 'Esta conta ainda não está associada a uma organização.',
      };
    }

    const resultadoOrganizacao =
      profile.organizacoes as unknown as
        | OrganizacaoLicenca
        | OrganizacaoLicenca[]
        | null;

    const licenca = Array.isArray(resultadoOrganizacao)
      ? resultadoOrganizacao[0]
      : resultadoOrganizacao;

    if (!licenca) {
      return {
        acessoPermitido: false,
        motivo: 'A organização ou licença não foi encontrada.',
      };
    }

    if (licenca.status_licenca !== 'activa') {
      return {
        acessoPermitido: false,
        motivo:
          'A licença desta organização encontra-se inativa ou suspensa.',
        dataInicio: licenca.inicio_licenca ?? undefined,
        dataValidade: licenca.valida_ate ?? undefined,
      };
    }

    if (!licenca.inicio_licenca || !licenca.valida_ate) {
      return {
        acessoPermitido: false,
        motivo:
          'As datas de início e término da licença não estão configuradas.',
      };
    }

    const agora = Date.now();
    const inicio = new Date(licenca.inicio_licenca);
    const validade = new Date(licenca.valida_ate);

    const inicioMs = inicio.getTime();
    const validadeMs = validade.getTime();

    if (
      !Number.isFinite(inicioMs) ||
      !Number.isFinite(validadeMs)
    ) {
      return {
        acessoPermitido: false,
        motivo: 'As datas da licença não são válidas.',
      };
    }

    if (agora < inicioMs) {
      return {
        acessoPermitido: false,
        motivo: `A licença começa em ${inicio.toLocaleDateString(
          'pt-PT'
        )}.`,
        dataInicio: licenca.inicio_licenca,
        dataValidade: licenca.valida_ate,
      };
    }

    // Usa >= para corresponder à política do Supabase:
    // o acesso é permitido apenas enquanto agora < valida_ate.
    if (agora >= validadeMs) {
      return {
        acessoPermitido: false,
        motivo: `A licença expirou em ${validade.toLocaleDateString(
          'pt-PT'
        )}.`,
        dataInicio: licenca.inicio_licenca,
        dataValidade: licenca.valida_ate,
      };
    }

    return {
      acessoPermitido: true,
      dataInicio: licenca.inicio_licenca,
      dataValidade: licenca.valida_ate,
      superAdmin: false,
    };
  } catch (error) {
    console.error('Erro inesperado ao verificar a licença:', error);

    // Em caso de erro, bloquear sempre.
    return {
      acessoPermitido: false,
      motivo: 'Não foi possível validar a licença neste momento.',
    };
  }
}
}
