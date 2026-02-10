import { render, screen, fireEvent, userEvent, waitFor } from '@testing-library/react-native';
import { CreateSessionComponent } from '../CreateSessionScreen';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
  },
}));

// Mock Alert.alert pour éviter les erreurs natives
jest.spyOn(require('react-native').Alert, 'alert');

test('admin: créer une session de karting OK', async () => {
  const user = userEvent.setup();

  // Etant donné que je suis un administrateur authentifié
  // Quand je crée une session de karting avec les informations suivantes :
  // - Date et heure de début: 2024-07-01 14:00
  // - Durée : 30 minutes
  // - Nombre de karts disponibles : 10
  // - Prix : 20 euros
  render(<CreateSessionComponent />);

  fireEvent.changeText(screen.getByTestId('test-input-dateHeureDebut'), '2030-07-01 14:00');
  fireEvent.changeText(screen.getByTestId('test-input-duree'), '30');
  fireEvent.changeText(screen.getByTestId('test-input-nombreKartsDisponibles'), '10');
  fireEvent.changeText(screen.getByTestId('test-input-prix'), '20.00');

  await user.press(screen.getByTestId('test-creer'));

  // Alors la session de karting est créée avec succès
  await waitFor(() => {
    expect(screen.getByText('Session créée avec succès')).toBeTruthy();
  });
});
