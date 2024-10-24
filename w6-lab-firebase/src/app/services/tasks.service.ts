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