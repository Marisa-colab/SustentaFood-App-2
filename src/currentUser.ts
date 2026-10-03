// Nome do utilizador com sessão iniciada, usado como responsável por defeito nos registos.
let currentUserName = '';

export const setCurrentUserName = (name: string | null | undefined) => {
  currentUserName = (name || '').trim();
};

export const getCurrentUserName = () => currentUserName;
