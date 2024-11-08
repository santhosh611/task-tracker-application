document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const workerContainer = document.getElementById('workerContainer');
    const dashboard = document.getElementById('dashboard');
    const searchInput = document.getElementById('searchWorker');
    const workerList = document.getElementById('workerList');
    const loginModal = document.getElementById('loginModal');
    const loginModalTitle = document.getElementById('loginModalTitle');
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('passwordInput');
    const sidebarProfileImage = document.getElementById('sidebarProfileImage');
    const sidebarWorkerName = document.getElementById('sidebarWorkerName');
    const sidebarWorkerDepartment = document.getElementById('sidebarWorkerDepartment');
    const editProfileImageBtn = document.getElementById('editProfileImageBtn');
    const imageUpload = document.getElementById('imageUpload');
    const harvestForm = document.getElementById('harvestForm');
    const dynamicInputs = document.getElementById('dynamicInputs');
    const topicList = document.getElementById('topicList');
    const submitHarvest = document.getElementById('submitHarvest');
    const scoreTableBody = document.getElementById('scoreTableBody');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const dashboardLink = document.getElementById('dashboardLink');
    const applyLeaveLink = document.getElementById('applyLeaveLink');
    const leaveRequestsLink = document.getElementById('leaveRequestsLink');
    const commentsLink = document.getElementById('commentsLink');
    const dashboardContent = document.getElementById('dashboardContent');
    const applyLeaveContent = document.getElementById('applyLeaveContent');
    const leaveRequestsContent = document.getElementById('leaveRequestsContent');
    const commentsContent = document.getElementById('commentsContent');
    const leaveApplicationForm = document.getElementById('leaveApplicationForm');
    const leaveRequestsList = document.getElementById('leaveRequestsList');
    const commentList = document.getElementById('commentList');
    const addCommentForm = document.getElementById('addCommentForm');
    const leaveRequestNotification = document.getElementById('leaveRequestNotification');

    let currentWorker = null;

    // Load workers list
    function loadWorkers(searchTerm = '') {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const filteredWorkers = workers.filter(worker =>
            worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.department.toLowerCase().includes(searchTerm.toLowerCase())
        );

        workerList.innerHTML = '';
        filteredWorkers.forEach(worker => {
            const workerItem = document.createElement('div');
            workerItem.className = 'worker-item';
            workerItem.innerHTML = `
                <img src="${worker.photo || '/placeholder.svg?height=40&width=40&text=' + worker.name}" alt="${worker.name}'s photo">
                <div class="worker-info">
                    <div class="worker-name">${worker.name}</div>
                    <div class="worker-department">${worker.department}</div>
                </div>
            `;
            workerItem.addEventListener('click', () => openLoginModal(worker));
            workerList.appendChild(workerItem);
        });
    }

    // Handle worker login
    function openLoginModal(worker) {
        loginModalTitle.textContent = `Login: ${worker.name}`;
        loginModal.style.display = 'block';
        passwordInput.value = '';
        loginForm.onsubmit = (e) => {
            e.preventDefault();
            if (passwordInput.value === worker.password) {
                currentWorker = worker;
                loginModal.style.display = 'none';
                workerContainer.classList.add('hidden');
                dashboard.classList.remove('hidden');
                loadWorkerDashboard();
            } else {
                alert('Incorrect password. Please try again.');
            }
        };
    }

    // Load worker dashboard
    function loadWorkerDashboard() {
        sidebarProfileImage.src = currentWorker.photo || '/placeholder.svg?height=100&width=100&text=' + currentWorker.name;
        sidebarWorkerName.textContent = currentWorker.name;
        sidebarWorkerDepartment.textContent = currentWorker.department;
        loadHarvestForm();
        loadComments();
        updateLeaveRequestNotification();
        updateScoreboard();
        showDashboardContent();
    }

    // Load harvest form
    function loadHarvestForm() {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        const topics = JSON.parse(localStorage.getItem('topics')) || [];

        // Load harvest inputs
        dynamicInputs.innerHTML = '';
        columns.forEach(column => {
            if (column.department === 'all' || column.department === currentWorker.department) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'input-group';
                inputGroup.innerHTML = `
                    <label for="${column.name}">${column.name}:</label>
                    <input type="number" id="${column.name}" name="${column.name}" min="0" required>
                `;
                dynamicInputs.appendChild(inputGroup);
            }
        });

        // Load topics
        topicList.innerHTML = '';
        topics.forEach(topic => {
            const topicTag = document.createElement('label');
            topicTag.className = 'topic-tag';
            topicTag.innerHTML = `
                <input type="checkbox" name="${topic.name}">
                <span>${topic.name} (${topic.points} points)</span>
            `;
            topicList.appendChild(topicTag);
        });
    }

    // Handle harvest submission
    harvestForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const harvestData = {};
        const formData = new FormData(harvestForm);

        // Get harvest values
        for (const [name, value] of formData.entries()) {
            if (!name.includes('topic')) {
                harvestData[name] = parseInt(value) || 0;
            }
        }

        // Get selected topics
        const selectedTopics = Array.from(topicList.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.name);

        // Update worker data
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[currentWorker.name]) {
            workerData[currentWorker.name] = {
                activities: [],
                topicPoints: 0
            };
        }

        // Update harvest data
        Object.keys(harvestData).forEach(key => {
            workerData[currentWorker.name][key] = (workerData[currentWorker.name][key] || 0) + harvestData[key];
        });

        // Update topic points
        const topics = JSON.parse(localStorage.getItem('topics')) || [];
        const topicPoints = selectedTopics.reduce((total, topicName) => {
            const topic = topics.find(t => t.name === topicName);
            return total + (topic ? topic.points : 0);
        }, 0);
        workerData[currentWorker.name].topicPoints = (workerData[currentWorker.name].topicPoints || 0) + topicPoints;

        // Add activity record
        workerData[currentWorker.name].activities.push({
            timestamp: new Date().toISOString(),
            harvest: harvestData,
            topics: selectedTopics
        });

        localStorage.setItem('workerData', JSON.stringify(workerData));

        alert('Harvest submitted successfully!');
        harvestForm.reset();
        updateScoreboard();
    });

    // Load scoreboard
    function updateScoreboard() {
        const workers = JSON.parse(localStorage.getItem('workers')) || [];
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};

        const departmentWorkers = workers
            .filter(worker => worker.department === currentWorker.department)
            .map(worker => {
                const data = workerData[worker.name] || {};
                return {
                    name: worker.name,
                    points: calculateTotalPoints(data)
                };
            })
            .sort((a, b) => b.points - a.points);

        scoreTableBody.innerHTML = '';
        departmentWorkers.forEach((worker, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${worker.name}</td>
                <td>${worker.points}</td>
            `;
            scoreTableBody.appendChild(row);
        });
    }

    // Calculate total points
    function calculateTotalPoints(data) {
        const columns = JSON.parse(localStorage.getItem('columns')) || [];
        return columns.reduce((total, column) => {
            return total + (parseInt(data[column.name.toLowerCase().replace(/\s+/g, '')]) || 0);
        }, 0) + (parseInt(data.topicPoints) || 0);
    }

    // Handle search
    searchInput.addEventListener('input', (e) => {
        loadWorkers(e.target.value);
    });

    // Toggle sidebar
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-active');
    });

    // Handle sidebar navigation
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboardContent();
    });

    applyLeaveLink.addEventListener('click', (e) => {
        e.preventDefault();
        showApplyLeaveContent();
    });

    leaveRequestsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLeaveRequestsContent();
    });

    commentsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showCommentsContent();
    });

    // Show dashboard content
    function showDashboardContent() {
        hideAllContent();
        dashboardContent.classList.remove('hidden');
        setActiveLink(dashboardLink);
    }

    // Show apply leave content
    function showApplyLeaveContent() {
        hideAllContent();
        applyLeaveContent.classList.remove('hidden');
        setActiveLink(applyLeaveLink);
    }

    // Show leave requests content
    function showLeaveRequestsContent() {
        hideAllContent();
        leaveRequestsContent.classList.remove('hidden');
        setActiveLink(leaveRequestsLink);
        loadLeaveRequests();
    }

    // Show comments content
    function showCommentsContent() {
        hideAllContent();
        commentsContent.classList.remove('hidden');
        setActiveLink(commentsLink);
        loadComments();
    }

    // Hide all content sections
    function hideAllContent() {
        dashboardContent.classList.add('hidden');
        applyLeaveContent.classList.add('hidden');
        leaveRequestsContent.classList.add('hidden');
        commentsContent.classList.add('hidden');
    }

    // Set active link in sidebar
    function setActiveLink(activeLink) {
        const links = [dashboardLink, applyLeaveLink, leaveRequestsLink, commentsLink];
        links.forEach(link => link.classList.remove('active'));
        activeLink.classList.add('active');
    }

    // Load comments
    function loadComments() {
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        const comments = workerData[currentWorker.name]?.comments || [];
        
        commentList.innerHTML = '';
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <p>${comment.text}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
            `;
            commentList.appendChild(commentElement);
        });
    }

    // Handle leave application
    leaveApplicationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const leaveType = document.getElementById('leaveType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const totalDays = document.getElementById('totalDays').value;
        const reason = document.getElementById('reason').value;

        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const newApplication = {
            id: Date.now().toString(),
            workerName: currentWorker.name,
            department: currentWorker.department,
            leaveType,
            startDate,
            endDate,
            totalDays,
            reason,
            status: 'Pending',
            submittedAt: new Date().toISOString()
        };
        leaveApplications.push(newApplication);
        localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));

        alert('Leave application submitted successfully!');
        leaveApplicationForm.reset();
    });

    // Load leave requests
    function loadLeaveRequests() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const workerApplications = leaveApplications.filter(app => app.workerName === currentWorker.name);
        
        leaveRequestsList.innerHTML = '';
        workerApplications.forEach(app => {
            const requestElement = document.createElement('div');
            requestElement.className = 'leave-request';
            requestElement.innerHTML = `
                <p><strong>Leave Type:</strong> ${app.leaveType}</p>
                <p><strong>Dates:</strong> ${app.startDate} to ${app.endDate}</p>
                <p><strong>Status:</strong> ${app.status}</p>
            `;
            leaveRequestsList.appendChild(requestElement);
        });
    }

    // Update leave request notification
    function updateLeaveRequestNotification() {
        const leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];
        const newApplications = leaveApplications.filter(app => 
            app.workerName === currentWorker.name && 
            (app.status === 'Approved' || app.status === 'Rejected') && 
            !app.workerViewed
        );
        
        if (newApplications.length > 0) {
            leaveRequestNotification.classList.remove('hidden');
        } else {
            leaveRequestNotification.classList.add('hidden');
        }
    }

    // Handle adding a new comment
    addCommentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const commentText = document.getElementById('commentText').value;
        
        const workerData = JSON.parse(localStorage.getItem('workerData')) || {};
        if (!workerData[currentWorker.name]) {
            workerData[currentWorker.name] = { comments: [] };
        }
        
        const newComment = {
            text: commentText,
            timestamp: new Date().toISOString()
        };
        
        workerData[currentWorker.name].comments = workerData[currentWorker.name].comments || [];
        workerData[currentWorker.name].comments.push(newComment);
        
        localStorage.setItem('workerData', JSON.stringify(workerData));
        
        addCommentForm.reset();
        loadComments();
    });

    // Handle profile image edit
    editProfileImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newPhotoUrl = e.target.result;
                sidebarProfileImage.src = newPhotoUrl;
                
                // Update worker's photo in localStorage
                const workers = JSON.parse(localStorage.getItem('workers')) || [];
                const updatedWorkers = workers.map(worker => {
                    if (worker.name === currentWorker.name) {
                        return { ...worker, photo: newPhotoUrl };
                    }
                    return worker;
                });
                localStorage.setItem('workers', JSON.stringify(updatedWorkers));
                
                // Update current worker's photo
                currentWorker.photo = newPhotoUrl;
            };
            reader.readAsDataURL(file);
        }
    });

    // Calculate total days for leave application
    document.getElementById('startDate').addEventListener('change', updateTotalDays);
    document.getElementById('endDate').addEventListener('change', updateTotalDays);

    function updateTotalDays() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        
        if (startDate && endDate) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            document.getElementById('totalDays').value = diffDays;
        }
    }

    // Close modals when clicking on the close button or outside the modal
    document.querySelectorAll('.modal .close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            closeBtn.closest('.modal').style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Initial load
    loadWorkers();
});
