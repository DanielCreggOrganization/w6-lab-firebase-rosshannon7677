[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=16740894)
# Firebase Lab

## Agenda

1. [Project Setup and Firebase Configuration](#1-project-setup-and-firebase-configuration)
2. [Authentication Implementation](#2-authentication-implementation)
3. [Firestore Integration](#3-firestore-integration)
4. [Route Protection and Guards](#4-route-protection-and-guards)
5. [Task Management Implementation](#5-task-management-implementation)

## 1. Project Setup and Firebase Configuration

### Concept Introduction: Project Architecture

The lab demonstrates building a task management application using Ionic Angular with Firebase services. The architecture combines Firebase Authentication for user management and Firestore for data storage.

```mermaid
graph TD
    A[Ionic Angular App] --> B[Firebase Services]
    B --> C[Authentication]
    B --> D[Firestore Database]
    C --> E[Email/Password Auth]
    D --> F[Tasks Collection]
    A --> G[Components]
    G --> H[Login Page]
    G --> I[Home Page]
    G --> J[Task Modal]
```

### Procedure

1. Create Firebase Project:
   - Navigate to the Firebase website. Hold the ``ctrl`` key on your keyboard and click on this link: [Firebase Console](https://console.firebase.google.com)
   - Sign in to Firebase.
   - Click on the "Create a project" tile.
   - Name it "firebase-ionic-project".
   - Disable Google Analytics and click the ``Create project`` button. This may take a minute to create.
   - Click on the ``Build`` dropdown in the left hand panel, select ``Authentication`` and click the ``Get started`` button. Select Email/Password. Enable Email/Password and click ``Save``
   - Click on the ``Build`` dropdown in the left hand panel, select ``Firestore Database`` and click the ``Create database`` button. Select Location as ``europe-west2 (London)``. Select ``Start in test mode`` and click the ``Create`` button.
   - Click on the Rules tab and change the timestamp date to the last day of the year, December 31st. Click on the ``Publish`` button. 
   - Click on ``Project Overview`` button in the top left of the page and then click on the Web button marked ``</>``. Register a web app in your Firebase project called ``ionic-web-app``. Click the ``Continue to console`` button.
   - We will now integrate our new firebase project with our Ionic app using the below procedure.

2. Configure Firebase Services:
   ```bash
   # Create new Ionic standalone project
   ionic start w6-lab-firebase blank --type=angular

   # Install required tools
   npm install -g @angular/cli
   npm install -g firebase-tools

   # Login to Firebase
   firebase login

   # Install AngularFire
   ng add @angular/fire
   ```

### Configuration Example  
Take a look at your ``main.ts`` file. Make sure you have inputs like shown below:

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp({
      projectId: "fir-ionic-project-dc52e",
      appId: "1:769063483414:web:0b402d09efd31d324dca57",
      storageBucket: "fir-ionic-project-dc52e.appspot.com",
      apiKey: "AIzaSyDibzo0p2mUnQmjN6RlfXlHjbgkzSIUjFY",
      authDomain: "fir-ionic-project-dc52e.firebaseapp.com",
      messagingSenderId: "769063383314"
    })),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
});
```

## 2. Authentication Implementation

### Concept Introduction: Firebase Authentication

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Firebase
    
    User->>App: Enter Credentials
    App->>Firebase: Authentication Request
    Firebase-->>App: Auth Response
    App-->>User: Success/Error Message
```

### Generate Required Components

```bash
# Generate auth service
ionic g service auth

# Generate login page
ionic g page login --standalone
```
The login page will look like this:  
![login page](https://github.com/user-attachments/assets/d5710f9c-d0d3-4043-bd5a-44083b8ba81b)


### Auth Service Implementation

```typescript
// src/app/services/auth.service.ts
/**
 * Service responsible for handling authentication operations
 * including user registration, authentication, password reset, and sign out.
 */
import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from '@angular/fire/auth';

/**
 * Interface for authentication request data
 */
interface UserAuthData {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Firebase Authentication instance
   */
  private readonly firebaseAuth = inject(Auth);

  /**
   * Registers a new user with email and password
   * @param userAuthData - The user's email and password
   * @returns Promise resolving to UserCredential
   */
  async registerUser(userAuthData: UserAuthData): Promise<UserCredential> {
    return createUserWithEmailAndPassword(
      this.firebaseAuth,
      userAuthData.email,
      userAuthData.password
    );
  }

  /**
   * Authenticates a user with email and password
   * @param userAuthData - The user's email and password
   * @returns Promise resolving to UserCredential
   */
  async authenticateUser(userAuthData: UserAuthData): Promise<UserCredential> {
    return signInWithEmailAndPassword(
      this.firebaseAuth,
      userAuthData.email,
      userAuthData.password
    );
  }

  /**
   * Gets the current authenticated user
   * @returns The current User or null
   */
  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  /**
   * Initiates password reset process for a user
   * @param userEmail - The email address for password reset
   * @returns Promise resolving when email is sent
   */


  /**
   * Signs out the current user
   * @returns Promise resolving when sign out is complete
   */
  async signOutUser(): Promise<void> {
    return signOut(this.firebaseAuth);
  }
}
```

### Login Page Implementation

```typescript
// src/app/login/login.page.ts
/**
 * LoginPage handles user authentication including login, registration,
 * and password reset functionality.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { AlertController, LoadingController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { FirebaseError } from '@angular/fire/app';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ],
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly loadingController = inject(LoadingController);
  private readonly alertController = inject(AlertController);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isPasswordVisible = false;

  userAuthForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailControl() {
    return this.userAuthForm.controls.email;
  }

  get passwordControl() {
    return this.userAuthForm.controls.password;
  }

  /**
   * Handles user registration
   */
  async handleRegistration() {
    if (this.userAuthForm.invalid) return;

    const loading = await this.loadingController.create({
      message: 'Creating account...'
    });
    await loading.present();

    try {
      await this.authService.registerUser(this.userAuthForm.getRawValue());
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      const errorMessage = (error as FirebaseError).message;
      await this.showAlert('Registration Failed', errorMessage);
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Handles user authentication
   */
  async handleAuthentication() {
    if (this.userAuthForm.invalid) return;

    const loading = await this.loadingController.create({
      message: 'Signing in...'
    });
    await loading.present();

    try {
      await this.authService.authenticateUser(this.userAuthForm.getRawValue());
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      const errorMessage = (error as FirebaseError).message;
      await this.showAlert('Authentication Failed', errorMessage);
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Initiates password reset process
   */
 

  /**
   * Displays an alert with the given header and message
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
```

### DIY Tasks

1. Implement password reset functionality using Firebase's `sendPasswordResetEmail` method. You will need to update the auth service and the login page.
2. Add the Create Account button.
   
## 3. Firestore Integration

### Concept Introduction: Firestore Database

```mermaid
graph LR
    A[Firestore] --> B[Collections]
    B --> C[Tasks]
    C --> D[Document 1]
    C --> E[Document 2]
    D --> F[title: string<br/>description: string<br/>userId: string]
    E --> F
```

### Task Service Implementation

```typescript
// src/app/tasks.service.ts
/**
 * This file contains the TasksService which manages task data using Firebase/Firestore.
 * It handles user authentication state and provides methods for CRUD operations on tasks.
 */
import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import {
  collection,
  collectionData,
  deleteDoc,
  doc,
  Firestore,
  query,
  updateDoc,
  where,
  addDoc,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, switchMap, of } from 'rxjs';

/**
 * Interface defining the structure of a Task.
 * @property id - Optional unique identifier (provided by Firestore)
 * @property content - The task description or content
 * @property completed - Boolean indicating if the task is done
 * @property user - Optional user ID who owns the task
 */
export interface Task {
  id?: string;
  content: string;
  completed: boolean;
  user?: string;
}

/**
 * Service responsible for managing tasks in the application.
 * Uses Firebase Authentication and Firestore for data persistence.
 */
@Injectable({
  providedIn: 'root', // Makes this service available throughout the app
})
export class TasksService {
  // Inject Firebase services using the new inject() syntax instead of constructor injection
  private readonly firestoreDb = inject(Firestore);
  private readonly authService = inject(Auth);
  
  // Reference to the Firestore 'tasks' collection
  private readonly tasksCollectionRef = collection(this.firestoreDb, 'tasks');
  
  /**
   * BehaviorSubject keeping track of the current authenticated user.
   * BehaviorSubject is used because it:
   * 1. Requires an initial value (null in this case)
   * 2. Caches the latest value
   * 3. Emits the latest value to new subscribers
   * 4. Ensures new subscribers get the current authentication state immediately
   */
  private readonly authenticatedUser$ = new BehaviorSubject<User | null>(null);
  
  /**
   * Observable stream of tasks that automatically updates based on authentication state.
   * Using switchMap because:
   * 1. It cancels previous subscriptions when user changes (prevents memory leaks)
   * 2. Creates a new subscription for the new user
   * 3. Returns empty array when no user is logged in
   * 
   * Made readonly to prevent external code from accidentally modifying the stream
   */
  readonly userTasks$ = this.authenticatedUser$.pipe(
    switchMap(user => {
      // If no user is logged in, return an empty array
      if (!user) return of([]);
      
      // Create a query that filters tasks by the current user's ID
      const userTasksQuery = query(
        this.tasksCollectionRef, 
        where('user', '==', user.uid)
      );

      // Return an Observable of the query results
      // collectionData creates an Observable that emits the current value of the collection
      // idField: 'id' adds the document ID to each task object
      return collectionData(userTasksQuery, { idField: 'id' }) as Observable<Task[]>;
    })
  );

  constructor() {
    // Set up authentication state listener
    // This updates authenticatedUser$ whenever the user logs in or out
    onAuthStateChanged(this.authService, user => this.authenticatedUser$.next(user));
  }

  /**
   * Creates a new task in Firestore.
   * @param task The task to create (without id and user)
   * @returns Promise that resolves when the task is created
   * @throws Error if creation fails
   */
  async createTask(task: Task) {
    try {
      return await addDoc(this.tasksCollectionRef, {
        ...task,
        user: this.authService.currentUser?.uid, // Attach current user's ID to the task
      });
    } catch (error) {
      console.error('Error creating task:', error);
      throw error; // Re-throw to allow handling in components
    }
  }

  /**
   * Returns an Observable of all tasks for the current user.
   * The Observable automatically updates when:
   * 1. User logs in/out
   * 2. Tasks are added/modified/deleted
   * @returns Observable<Task[]>
   */
  getUserTasks(): Observable<Task[]> {
    return this.userTasks$;
  }

  /**
   * Updates an existing task's content in Firestore.
   * @param task The task to update (must include id)
   * @returns Promise that resolves when the update is complete
   * @throws Error if update fails
   */
  async updateTask(task: Task) {
    try {
      const taskDocRef = doc(this.firestoreDb, `tasks/${task.id}`);
      return await updateDoc(taskDocRef, { content: task.content });
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  /**
   * Deletes a task from Firestore.
   * @param task The task to delete (must include id)
   * @returns Promise that resolves when the deletion is complete
   * @throws Error if deletion fails
   */
  async deleteTask(task: Task) {
    try {
      const taskDocRef = doc(this.firestoreDb, `tasks/${task.id}`);
      return await deleteDoc(taskDocRef);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  /**
   * Toggles the completed status of a task in Firestore.
   * @param task The task to toggle (must include id and completed status)
   * @returns Promise that resolves when the update is complete
   * @throws Error if update fails
   */
  async toggleTaskCompleted(task: Task) {
    try {
      const taskDocRef = doc(this.firestoreDb, `tasks/${task.id}`);
      return await updateDoc(taskDocRef, { completed: task.completed });
    } catch (error) {
      console.error('Error toggling task:', error);
      throw error;
    }
  }
}
```

We will use the Home page to dispay all tasks.  
![tasks image](https://github.com/user-attachments/assets/e6137af5-e7a6-44ea-82e1-6f4ec0fc56c3)

```typescript
// src/app/home/home.page.ts
import { AfterViewInit, Component, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  AlertController, 
  LoadingController, 
  CheckboxCustomEvent, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonButtons,
  IonList, 
  IonItemSliding, 
  IonItem, 
  IonLabel,
  IonIcon,
  IonCheckbox, 
  IonItemOptions, 
  IonItemOption, 
  IonModal, 
  IonInput, 
  IonRow, 
  IonCol, 
  IonFab, 
  IonFabButton, 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { Observable } from 'rxjs';
import { logOutOutline, pencilOutline, trashOutline, add } from 'ionicons/icons';
import { AuthService } from '../auth.service';
import { TasksService, Task } from '../tasks.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonList,
    IonItemSliding,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonItemOptions,
    IonItemOption,
    IonModal,
    IonInput,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
  ],
})

export class HomePage implements AfterViewInit {
  newTask!: Task; // This is the task that will be added to the database.
  @ViewChild(IonModal) modal!: IonModal; // Find the first IonModal in my template and assign it to the modal property of my class.
  tasks$!: Observable<Task[]>; // This is an observable that will emit the current value of the tasks array. // This is an observable that will emit the current value of the tasks array.
  
  private authService = inject(AuthService);
  private tasksService = inject(TasksService);
  private router = inject(Router);
  private loadingController = inject(LoadingController);
  private alertController = inject(AlertController);

  constructor() {
    //this.resetTask();
    //addIcons({ logOutOutline, pencilOutline, trashOutline, add });
  }

  ngOnInit() {
    this.resetTask();
    addIcons({ logOutOutline, pencilOutline, trashOutline, add });
    this.tasks$ = this.tasksService.readTasks();
  }

  // This method is used to reset the newTask property. This will clear the input in the modal.
  resetTask() {
    this.newTask = {
      content: '',
      completed: false,
    };
  }

  // This method is used to log the user out. The button will be found in the top right corner of the home page.
  async logout() {
    // Call the logout method in the auth service. Use await to wait for the logout to complete before continuing.
    await this.authService.logout();
    // Navigate to the login page with the replaceUrl option.
    // This means that the login page will replace the home page in the navigation stack.
    this.router.navigateByUrl('/', { replaceUrl: true });
  }

  // This method is used to add a task to the database
  async addTask() {
    const loading = await this.loadingController.create();
    // await means that the code will wait for the loading to be presented before continuing
    await loading.present();
    // Add the task to the database
    this.tasksService.createTask(this.newTask);
    // Dismiss the loading
    await loading.dismiss();
    // Dismiss the modal
    this.modal.dismiss(null, 'confirm');
    // Reset the task. This will clear the input in the modal.
    this.resetTask();
  }

  // This method is used to update the checkbox in the UI when the user toggles the checkbox


  async updateTask() {
    await this.tasksService.updateTask(this.newTask);
    this.resetTask();
  }

  async openUpdateInput(task: Task) {
    const alert = await this.alertController.create({
      header: 'Update Task',
      inputs: [
        {
          name: 'Task',
          type: 'text',
          placeholder: 'Task content',
          value: task.content,
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Update',
          // Call the updateTask method when the user clicks the update button
          handler: (data) => {
            task.content = data.Task;
            this.tasksService.updateTask(task);
          },
        },
      ],
    });
    await alert.present(); // Present the alert to the user
    // Get the alert's first input element and focus the mouse blinker on it.
    // The setTimeout function is used to allow some time for the browser to render the alert's DOM elements.
    setTimeout(() => {
      const firstInput: any = document.querySelector('ion-alert input');
      firstInput.focus();
    }, 250);
  }

  deleteTask(task: Task) {
    // Print task to console
    console.log('Deleting task: ', task);
    this.tasksService.deleteTask(task);
  }

  // The method is used inside the modal to close the modal and reset the newTask property.
  cancel() {
    this.modal.dismiss(null, 'cancel');
    this.resetTask();
  }

  // This method is used to focus the cursor in the input box of the modal when we open it. We subscribe to
  // the ionModalDidPresent event of the modal. When the modal is presented, we use setTimeout to wait for
  // the browser to render the modal's DOM elements, then we select the first input element in the modal and focus on it.
  ngAfterViewInit() {
    this.modal.ionModalDidPresent.subscribe(() => {
      setTimeout(() => {
        const firstInput: any = document.querySelector('ion-modal input');
        firstInput.focus();
      }, 250);
    });
  }
}
```
Here is the Template for the home page
```html
<!-- Add a header to the page with a logout button and the title "My Tasks" -->
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="end">
      <ion-button (click)="logout()">
        <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title> My Tasks </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <ion-list>
    <!-- The tasks array is an observable that emits an array of tasks. The | async pipe is used to subscribe 
         to the tasks observable and unwrap the emitted value. The home.page.html file knows about the tasks 
         property because it is bound to it using the *ngFor directive. The *ngFor directive is used to loop 
         over the tasks array and generate HTML elements for each task.-->
    <ion-item-sliding *ngFor = "let task of tasks$ | async">
      <ion-item>
        <!-- Display the task content -->
        <ion-label>
          <h3>{{task.content}}</h3>
        </ion-label>
        <!-- Display a checkbox to mark the task as completed. Use event binding that listens for the ionChange event. 
             This event is emitted by Ionic components when their value changes (i.e. the tick box is checked or unchecked)
             [checked]="task.completed" is an example of property binding.the checked property of an element is being bound
             to the completed property of the task object   -->

      </ion-item>
      <!-- Create a sliding button to edit the task title or delete the task -->
      <ion-item-options side="end">
        <ion-item-option color="danger" (click)="deleteTask(task)">
          <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
        </ion-item-option>
      </ion-item-options>
    </ion-item-sliding>
  </ion-list>

  <!-- Create a pop up modal to add a new task. Trigger the modal with FAB button created below. -->
  <!-- #modal is used to access the modal in the template -->
  <ion-modal trigger="open-modal" #modal>
    <!-- ng-template is used with the ViewChild decorator to create a template reference variable, 
         which is then used to present the modal. The ViewChild decorator is used to access the modal
         in the component class. The #modal variable is used to access the modal in the template.-->
    <ng-template>
      <!-- In the modal, create an input to enter a new task. Use two-way binding to bind the input to the newTask property -->
      <ion-item>
        <ion-label position="stacked">New Task</ion-label>
        <ion-input
          type="text"
          placeholder="Enter task content here..."
          [(ngModel)]="newTask.content"
        ></ion-input>
      </ion-item>

      <!-- Add buttons in the modal to save or cancel the task entry. Place them side by side using rows and columns. -->
      <ion-row>
        <ion-col>
          <ion-button (click)="addTask()" color="primary" expand="full">
            Save
          </ion-button>
        </ion-col>
        <ion-col>
          <ion-button (click)="cancel()" color="danger" expand="full">
            Cancel
          </ion-button>
        </ion-col>
      </ion-row>
    </ng-template>
  </ion-modal>

  <!-- FAB = Floating Action Button. This creates a button that is always visible on the screen.
       The button contains a plus symbol and is used to add a new task -->
  <ion-fab slot="fixed" vertical="bottom" horizontal="end">
    <ion-fab-button id="open-modal">
      <ion-icon name="add"></ion-icon>
    </ion-fab-button>
  </ion-fab>
</ion-content>
```

### DIY Tasks

1. Add a method to toggle the Task completed atribute. Use a checkbox as seen in the image above.
2. Update *ngFor to @For
3. Add the toggle ckeck box
4. Add a sliding button to edit the Task.
5. Add a "Logged in user: user email" to the bottom of the home page.

## Common Issues and Troubleshooting

1. Firebase Initialization Errors:
   - Check if environment variables are correctly configured
   - Ensure Firebase services are enabled in console

2. Authentication Errors:
   - Verify email/password requirements
   - Check Firebase console for auth settings

3. Firestore Permission Errors:
   - Review security rules
   - Verify user authentication state

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [AngularFire Documentation](https://github.com/angular/angularfire)

---
End of Lab
