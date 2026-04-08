import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useLoginUserMutation, useRegisterUserMutation } from '../generated/graphql'

export function useAuth(setIsLoggedIn: (v: boolean) => void) {
  const navigate = useNavigate()

  const [loginMutation] = useLoginUserMutation({
    onCompleted: (data) => {
      sessionStorage.setItem('userToken', data.loginUser.token)
      setIsLoggedIn(true)
      navigate('/home')
    },
    onError: (err) => {
      if (!(err as unknown as { sessionExpired?: boolean }).sessionExpired) {
        toast.error(err.message)
      }
    }
  })

  const [registerMutation] = useRegisterUserMutation({
    onCompleted: () => navigate('/login'),
    onError: (err) => toast.error(err.message)
  })

  const handleLogin = (email: string, password: string) =>
    loginMutation({ variables: { email, password } })

  const handleRegister = (name: string, surname: string, email: string, password: string) =>
    registerMutation({ variables: { input: { name, surname, email, password } } })

  const handleLogout = () => {
    sessionStorage.clear()
    setIsLoggedIn(false)
    navigate('/')
  }

  return { handleLogin, handleRegister, handleLogout }
}
