# FitPro - TODO

- [x] Modal de confirmation avant swap de séance dans le calendrier avec message d'avertissement alimentation
- [x] Adapter les repas restants (non encore mangés) du jour A et du jour B lors d'un swap pour atteindre le nouvel objectif calorique
- [x] Adapter les repas restants quand une séance est annulée (bouton "Je n'ai pas fait la séance")
- [x] Fix : bloquer le scroll horizontal du calendrier pendant le drag & drop, et ne permettre le défilement automatique qu'aux extrémités gauche/droite
- [x] Fix : bloquer le scroll vertical de la page pendant le drag & drop calendrier
- [x] Fix : le plan alimentaire (onglet Nutrition) doit afficher les calories correspondant au type de séance du jour (précision à 80 kcal près)
- [x] Fix : getDayLog retourne toujours "repos" quand aucun repas n'est enregistré, sans consulter les overrides du calendrier ni le cycle 14 jours
- [x] Fix : l'app n'a pas la notion du jour courant dans le cycle 14 jours (utilise un programme fixe semaine)
- [x] Fix : les quantités des repas dans le plan ne s'adaptent pas aux macros cibles du type de séance (portions réalistes, max ~200g poulet, ~150g riz cru, etc.)
- [x] Fix : sans date de démarrage du programme, getDayLog utilise le fallback jour-de-semaine au lieu du cycle 14 jours — les overrides cycle_day_X ne fonctionnent pas
