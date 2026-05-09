import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios.js';
import { useAuthStore } from '../store/authStore.js';
import { useCartStore } from '../store/cartStore.js';
import { queryClient } from '../lib/queryClient.js';
import { toast } from 'react-toastify';

export function useLogin() {
  const { login } = useAuthStore();
  const navigate  = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }) => login(email, password),
    onSuccess: (data) => {
      toast.success('Welcome back!');
      if (data.role === 'admin') navigate('/admin/dashboard');
      else navigate('/');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRegister() {
  const { setToken, setUser } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload) => api.post('/auth/register', payload),
    onSuccess: (data) => {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      toast.success('Account created!');
      navigate('/');
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const { clearCart } = useCartStore();
  const navigate = useNavigate();

  return () => {
    logout();
    clearCart();
    queryClient.clear();
    navigate('/login');
  };
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const { setUser } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn:  () => api.get('/auth/me'),
    enabled:  !!token,
    onSuccess: (data) => setUser(data.user),
  });
}

export function useChangePassword() {
  const logout = useLogout();
  return useMutation({
    mutationFn: (payload) => api.post('/profile/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed — please log in again');
      setTimeout(logout, 1500);
    },
    onError: (err) => toast.error(err.message),
  });
}
