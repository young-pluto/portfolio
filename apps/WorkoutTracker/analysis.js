// Analysis Module — last 7 days muscle group frequency & volume (sets)
const AnalysisModule = (() => {
    // DOM Elements
    const summaryContainer = document.getElementById('analysis-summary');
    const cardsContainer = document.getElementById('analysis-cards');
    const volumeCanvas = document.getElementById('muscle-volume-chart');
    const frequencyCanvas = document.getElementById('muscle-frequency-chart');
    const refreshBtn = document.getElementById('analysis-refresh-btn');

    // Chart instances
    let volumeChartInstance = null;
    let frequencyChartInstance = null;

    // A stable, distinct color per muscle group
    const MUSCLE_COLORS = {
        'Chest': '#6366f1',
        'Back': '#3b82f6',
        'Shoulders': '#06b6d4',
        'Biceps': '#10b981',
        'Triceps': '#84cc16',
        'Forearms': '#eab308',
        'Core': '#f59e0b',
        'Quads': '#f97316',
        'Hamstrings': '#ef4444',
        'Glutes': '#ec4899',
        'Calves': '#a855f7',
        'Full Body': '#8b5cf6',
        'Cardio': '#14b8a6',
        'Other': '#64748b',
        'Unassigned': '#94a3b8'
    };

    const colorFor = (mg) => MUSCLE_COLORS[mg] || '#64748b';

    // Return YYYY-MM-DD for `daysAgo` days before today (local time)
    const dateStringDaysAgo = (daysAgo) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - daysAgo);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Resolve the muscle group for an exercise entry inside a stored workout
    const resolveMuscleGroup = (exerciseId, storedExercise) => {
        // Prefer the current definition (so re-tagging updates historical analysis)
        if (typeof ExercisesModule !== 'undefined') {
            const live = ExercisesModule.getExerciseById(exerciseId);
            if (live && live.muscleGroup) return live.muscleGroup;
        }
        if (storedExercise && storedExercise.muscleGroup) return storedExercise.muscleGroup;
        return 'Unassigned';
    };

    // Count sets that actually have data (weight or reps)
    const countLoggedSets = (sets) => {
        if (!sets) return 0;
        return Object.values(sets).filter(s => s && (s.weight || s.reps)).length;
    };

    // Load and render the last-7-days analysis
    const loadAnalysis = () => {
        if (typeof AuthModule === 'undefined' || !AuthModule.getCurrentUser()) return;

        const user = AuthModule.getCurrentUser();
        const workoutsRef = database.ref(`users/${user.uid}/workouts`);
        const cutoff = dateStringDaysAgo(6); // today + previous 6 days = 7-day window

        if (summaryContainer) {
            summaryContainer.innerHTML = '<div class="analysis-loading">Crunching your last 7 days…</div>';
        }

        workoutsRef.orderByChild('timestamp').once('value', (snapshot) => {
            const stats = {};           // muscleGroup -> { sets, days:Set }
            const trainingDays = new Set();
            let totalSets = 0;
            let totalExerciseEntries = 0;
            let workoutsInRange = 0;

            snapshot.forEach((childSnapshot) => {
                const workout = childSnapshot.val();
                if (!workout || !workout.date) return;
                if (workout.date < cutoff) return; // outside 7-day window

                workoutsInRange++;
                trainingDays.add(workout.date);

                if (!workout.exercises) return;
                Object.keys(workout.exercises).forEach((exerciseId) => {
                    const ex = workout.exercises[exerciseId];
                    const setCount = countLoggedSets(ex.sets);
                    if (setCount === 0) return;

                    const mg = resolveMuscleGroup(exerciseId, ex);
                    if (!stats[mg]) {
                        stats[mg] = { sets: 0, days: new Set() };
                    }
                    stats[mg].sets += setCount;
                    stats[mg].days.add(workout.date);

                    totalSets += setCount;
                    totalExerciseEntries++;
                });
            });

            render(stats, {
                trainingDays: trainingDays.size,
                totalSets,
                totalExerciseEntries,
                workoutsInRange,
                muscleGroupsHit: Object.keys(stats).length
            });
        }).catch((error) => {
            console.error('Error loading analysis:', error);
            if (summaryContainer) {
                summaryContainer.innerHTML = '<div class="analysis-empty">Could not load analysis. Please try again.</div>';
            }
        });
    };

    // Render summary tiles, charts, and per-group cards
    const render = (stats, totals) => {
        // Sort muscle groups by set volume (desc)
        const groups = Object.keys(stats).sort((a, b) => stats[b].sets - stats[a].sets);

        renderSummary(totals);

        if (groups.length === 0) {
            if (cardsContainer) {
                cardsContainer.innerHTML = '<div class="analysis-empty">No sets logged in the last 7 days. Log a workout to see your muscle group breakdown here.</div>';
            }
            destroyCharts();
            return;
        }

        renderVolumeChart(groups, stats);
        renderFrequencyChart(groups, stats);
        renderCards(groups, stats);
    };

    const renderSummary = (t) => {
        if (!summaryContainer) return;
        const tiles = [
            { label: 'Workouts', value: t.workoutsInRange, icon: 'fa-dumbbell' },
            { label: 'Days Trained', value: t.trainingDays, icon: 'fa-calendar-check' },
            { label: 'Total Sets', value: t.totalSets, icon: 'fa-layer-group' },
            { label: 'Muscle Groups', value: t.muscleGroupsHit, icon: 'fa-bullseye' }
        ];
        summaryContainer.innerHTML = tiles.map(tile => `
            <div class="analysis-stat-tile">
                <i class="fas ${tile.icon}"></i>
                <div class="analysis-stat-value">${tile.value}</div>
                <div class="analysis-stat-label">${tile.label}</div>
            </div>
        `).join('');
    };

    const chartTextColor = () =>
        document.body.classList.contains('dark-mode') ? '#a1a1a6' : '#475569';
    const chartGridColor = () =>
        document.body.classList.contains('dark-mode') ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const renderVolumeChart = (groups, stats) => {
        if (!volumeCanvas) return;
        const labels = groups;
        const values = groups.map(g => stats[g].sets);
        const colors = groups.map(g => colorFor(g));

        if (volumeChartInstance) volumeChartInstance.destroy();

        volumeChartInstance = new Chart(volumeCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Sets',
                    data: values,
                    backgroundColor: colors.map(c => c + 'cc'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: baseBarOptions(' sets')
        });
    };

    const renderFrequencyChart = (groups, stats) => {
        if (!frequencyCanvas) return;
        const labels = groups;
        const values = groups.map(g => stats[g].days.size);
        const colors = groups.map(g => colorFor(g));

        if (frequencyChartInstance) frequencyChartInstance.destroy();

        frequencyChartInstance = new Chart(frequencyCanvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Days trained',
                    data: values,
                    backgroundColor: colors.map(c => c + 'cc'),
                    borderColor: colors,
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: baseBarOptions(' days', 1)
        });
    };

    const baseBarOptions = (unit, stepSize) => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.parsed.x}${unit}`
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: {
                    color: chartTextColor(),
                    precision: 0,
                    stepSize: stepSize || undefined
                },
                grid: { color: chartGridColor() }
            },
            y: {
                ticks: { color: chartTextColor() },
                grid: { display: false }
            }
        }
    });

    const renderCards = (groups, stats) => {
        if (!cardsContainer) return;
        cardsContainer.innerHTML = groups.map(g => {
            const s = stats[g];
            const days = s.days.size;
            return `
                <div class="analysis-card" style="--mg-color:${colorFor(g)}">
                    <div class="analysis-card-header">
                        <span class="analysis-card-dot"></span>
                        <span class="analysis-card-name">${g}</span>
                    </div>
                    <div class="analysis-card-stats">
                        <div class="analysis-card-stat">
                            <span class="analysis-card-num">${s.sets}</span>
                            <span class="analysis-card-unit">set${s.sets === 1 ? '' : 's'}</span>
                        </div>
                        <div class="analysis-card-stat">
                            <span class="analysis-card-num">${days}</span>
                            <span class="analysis-card-unit">day${days === 1 ? '' : 's'}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const destroyCharts = () => {
        if (volumeChartInstance) { volumeChartInstance.destroy(); volumeChartInstance = null; }
        if (frequencyChartInstance) { frequencyChartInstance.destroy(); frequencyChartInstance = null; }
    };

    // Initialize
    const init = () => {
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadAnalysis);
        }
    };

    return {
        init,
        loadAnalysis
    };
})();
