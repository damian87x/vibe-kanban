import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, PlayCircle } from "lucide-react";
import { orchestratorApi } from "@/lib/api";

interface OrchestratorStatus {
  active_tasks: ActiveTask[];
  queued_tasks: QueuedTask[];
  containers: ContainerStatus[];
}

interface ActiveTask {
  task_id: string;
  task_title: string;
  stage: string;
  container_id: number;
  started_at: string;
}

interface QueuedTask {
  task_id: string;
  task_title: string;
  created_at: string;
}

interface ContainerStatus {
  id: number;
  allocated_to?: string;
  status: string;
}

interface OrchestratorTask {
  id: string;
  title: string;
  stage?: string;
  outputs: {
    specification?: string;
    implementation?: string;
    review?: string;
  };
}

export default function OrchestratorPage() {
  const [status, setStatus] = useState<OrchestratorStatus | null>(null);
  const [tasks, setTasks] = useState<OrchestratorTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<OrchestratorTask | null>(null);
  const [, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statusRes, tasksRes] = await Promise.all([
        orchestratorApi.getStatus(),
        orchestratorApi.getTasks(),
      ]);
      setStatus(statusRes);
      setTasks(tasksRes);
    } catch (error) {
      console.error("Failed to fetch orchestrator data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (taskId: string, fromStage?: string) => {
    try {
      await orchestratorApi.retryTask(taskId, fromStage);
      await fetchData();
    } catch (error) {
      console.error("Failed to retry task:", error);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "pending":
        return "bg-gray-500";
      case "specification":
        return "bg-blue-500";
      case "implementation":
        return "bg-yellow-500";
      case "review_qa":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Orchestrator Dashboard</h1>
        <p className="text-gray-600">Monitor and manage task orchestration through specification, implementation, and QA stages</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Container Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Containers</CardTitle>
            <CardDescription>Execution container allocation</CardDescription>
          </CardHeader>
          <CardContent>
            {status?.containers.map((container) => (
              <div key={container.id} className="flex items-center justify-between mb-2">
                <span className="font-mono">Container {container.id}</span>
                <Badge variant={container.status === "busy" ? "destructive" : "success"}>
                  {container.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Tasks</CardTitle>
            <CardDescription>{status?.active_tasks.length || 0} running</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status?.active_tasks.map((task) => (
                <div key={task.task_id} className="border rounded p-2">
                  <div className="font-semibold text-sm truncate">{task.task_title}</div>
                  <div className="flex items-center justify-between mt-1">
                    <Badge className={getStageColor(task.stage)} variant="secondary">
                      {task.stage}
                    </Badge>
                    <span className="text-xs text-gray-500">Container {task.container_id}</span>
                  </div>
                </div>
              ))}
              {status?.active_tasks.length === 0 && (
                <p className="text-sm text-gray-500">No active tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Queued Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queued Tasks</CardTitle>
            <CardDescription>{status?.queued_tasks.length || 0} waiting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status?.queued_tasks.slice(0, 5).map((task) => (
                <div key={task.task_id} className="border rounded p-2">
                  <div className="font-semibold text-sm truncate">{task.task_title}</div>
                  <div className="text-xs text-gray-500">
                    Queued {new Date(task.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {status?.queued_tasks.length === 0 && (
                <p className="text-sm text-gray-500">No queued tasks</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Task Progress</CardTitle>
              <CardDescription>View task progression through orchestration stages</CardDescription>
            </div>
            <Button onClick={fetchData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{task.title}</h3>
                  <div className="flex items-center gap-2">
                    {task.stage && (
                      <Badge className={getStageColor(task.stage)} variant="secondary">
                        {task.stage}
                      </Badge>
                    )}
                    <Button
                      onClick={() => setSelectedTask(task)}
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${task.outputs.specification ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Specification</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${task.outputs.implementation ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Implementation</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${task.outputs.review ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-sm">Review & QA</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">{selectedTask.title}</h2>
                <Button onClick={() => setSelectedTask(null)} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <Tabs defaultValue="specification">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="specification">Specification</TabsTrigger>
                  <TabsTrigger value="implementation">Implementation</TabsTrigger>
                  <TabsTrigger value="review">Review & QA</TabsTrigger>
                </TabsList>
                
                <TabsContent value="specification" className="mt-4">
                  <div className="space-y-4">
                    {selectedTask.outputs.specification ? (
                      <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
                        {selectedTask.outputs.specification}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No specification output yet</p>
                    )}
                    <Button onClick={() => handleRetry(selectedTask.id, "specification")} variant="outline" size="sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Retry Specification
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="implementation" className="mt-4">
                  <div className="space-y-4">
                    {selectedTask.outputs.implementation ? (
                      <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
                        {selectedTask.outputs.implementation}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No implementation output yet</p>
                    )}
                    <Button onClick={() => handleRetry(selectedTask.id, "implementation")} variant="outline" size="sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Retry Implementation
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="review" className="mt-4">
                  <div className="space-y-4">
                    {selectedTask.outputs.review ? (
                      <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
                        {selectedTask.outputs.review}
                      </pre>
                    ) : (
                      <p className="text-gray-500">No review output yet</p>
                    )}
                    <Button onClick={() => handleRetry(selectedTask.id, "review_qa")} variant="outline" size="sm">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Retry Review
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}