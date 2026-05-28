同步调用优点：时效性强，等到结果才返回

缺点：拓展性差 性能差 级联失败

异步调用：消息发送者 消息代理 消息接收者

优点：解耦拓展性强，无需等待性能好，故障隔离，缓存消息流量削峰



![image-20260528125402008](./rabbitMQ.assets/image-20260528125402008-1779944046275-1-1779944053582-3.png)

**交换机只能路由和转发消息，不能存储消息**





## Work Queues 的概念

> **虽然有多个消费者绑定同一个队列，但是队列中的某一条消息只会被一个消费者消费，默认轮询**

![image-20260528135952981](./rabbitMQ.assets/image-20260528135952981-1779947997710-5.png)

两个队列的消费能力不一样，默认情况下 RabbitMQ 还是会采用轮询的方法将消息分配给每个队列，也就是平均分配

但这不是我们想要的效果，我们想要的效果是消费能力强的消费者处理更多的消息，甚至能够帮助消费能力弱的消费者。怎么样才能达到这样的效果呢，只需要在配置文件中添加以下信息

```yaml
  rabbitmq:
    listener:
      simple:
        prefetch: 1
```

这个配置信息相当于告诉消费者要一条一条地从队列中取出消息，**只有处理完一条消息才能取出下一条**

这样一来，就可以充分利用每一台机器的性能，**让消费能力强的消费者处理更多的消息，同时还可以避免消息在消费能力较弱的消费者上发生堆积的情况**



## 交换机

**真正的生产环境都会经过交换机来发送消息，而不是直接发送到队列**

交换机的作用：

接收 publisher 发送的消息
将消息按照规则路由到与交换机绑定的队列
交换机的类型有以下三种：

1. Fanout：广播
2. Direct：定向
3. Topic：话题

**注意：交换机只能路由和转发消息，不能存储消息**







### Fanout 交换机

**Fanout 交换机会将接收到的消息广播到每一个跟其绑定的 queue ，所以也叫广播模式**

![image-20260528143853481](./rabbitMQ.assets/image-20260528143853481-1779950338629-7.png)











### Direct 交换机

**Direct 交换机会将接收到的消息根据规则路由到指定的队列，被称为定向路由**

- 每一个 Queue 都与 Exchange 设置一个 bindingKey
- 发布者发送消息时，指定消息的 RoutingKey
- Exchange 将消息路由到 bindingKey 与消息 routingKey 一致的队列

需要注意的是：**同一个队列可以绑定多个 bindingKey ，如果有多个队列绑定了同一个 bindingKey ，就可以实现类似于 Fanout 交换机的效果。由此可以看出，Direct 交换机的功能比 Fanout 交换机更强大**

------

![image-20260528145136373](./rabbitMQ.assets/image-20260528145136373-1779951099110-9.png)













### Topic 交换机（推荐使用）

**Topic Exchange 与 Direct Exchange类似，区别在于 Topic Exchange 的 routingKey 可以是多个单词的列表（多个 routingKey 之间以.分割）**

------

Queue 与 Exchange 指定 bindingKey 时可以使用通配符

#：代指 0 个或多个单词
*：代指 1 个单词

![image-20260528145811366](./rabbitMQ.assets/image-20260528145811366-1779951493576-11.png)



- **Topic 交换机能实现的功能 Direct 交换机也能实现，不过用 Topic 交换机实现起来更加方便**
- **如果某条消息的 topic 符合多个 queue 的 bindingKey ，该条消息会发送给符合条件的所有 queue，实现类似于 Fanout 交换机的效果**









## 在 SpringBoot 项目中声明队列和交换机的方式



### 1. SpringAQMP提供的创建队列和交换机的类(基于bean)

SpringAMQP 提供了几个类，用来声明队列、交换机及其绑定关系：

- **Queue：用于声明队列，可以用工厂类 QueueBuilder 构建**
- **Exchange：用于声明交换机，可以用工厂类 ExchangeBuilder 构建**
- **Binding：用于声明队列和交换机的绑定关系，可以用工厂类 BindingBuilder 构建**



------

###### **示例：创建Fanout 类型的交换机，并且创建队列与这个交换机绑定**

```java
//在消费者端声明
@Configuration
public class FanoutConfiguration {

    //声明交换机
    @Bean
    public FanoutExchange fanoutExchange() {
        return ExchangeBuilder.fanoutExchange("notebook.fanout").build();
    }

    //声明队列
    @Bean
    public Queue fanoutQueue() {
        return QueueBuilder.durable("fanout.queue").build();
    }

    //绑定队列和交换机
    @Bean
    public Binding fanoutBinding(Queue fanoutQueue, FanoutExchange fanoutExchange) {
        return BindingBuilder.bind(fanoutQueue).to(fanoutExchange);
    }
}
```



###### **示例：创建Direct类型的交换机，并且创建队列与这个交换机绑定**

```java
//在消费者端声明
@Configuration
public class DirectConfiguration {

    //声明交换机
    @Bean
    public DirectExchange directExchange() {
        return ExchangeBuilder.DirecttExchange("notebook.direct").build();
    }

    //声明队列
    @Bean
    public Queue DirectQueue() {
        return QueueBuilder.durable("direct.queue").build();
    }

    //绑定队列和交换机
    @Bean
    public Binding DirectBinding(Queue DirectQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(directQueue).to(directExchange).with("your-routingkey");
    }
}
```

- **基于bean声明有一个缺点，当队列和交换机之间绑定的 routingKey 有很多个时，编码将会变得十分麻烦**







### 2.基于@RabbitListener注解声明

在消费者监听方法上直接定义交换机和队列并进行绑定

```java

@RabbitListener(bindings = @QueueBinding(
        value = @Queue(name = "direct.queue"),
        exchange = @Exchange(name = "notebook.direct", type = ExchangeTypes.DIRECT),
        key = {"red", "blue"}
))
public void listenDirectQueue(String message) {
    System.out.println("消费者 收到了 direct.queue的消息：【" + message + "】");
}
```







### 3.声明消息转换器

使用rabbitMQ发送消息时，默认使用JDK序列化，所以要切换到JSON序列化的

Spring Boot 并不会自动配置 JSON 转换器。你需要在一个 `@Configuration` 类中显式地配置 `Jackson2JsonMessageConverter`

```java
//在生产者和消费者服务中都需要进行声明

@Configuration
public class AMQPConfig {

    @Bean
    public MessageConverter messageConverter() {
        // 使用 Jackson2JsonMessageConverter 作为 Bean，以覆盖默认的 JDK 序列化方式
        return new Jackson2JsonMessageConverter();
    }
}
```

**为什么两边都需要？**

- **生产者端**：`RabbitTemplate` 需要 `MessageConverter` 来把 Java 对象序列化成消息体（JSON 格式）。
- **消费者端**：`@RabbitListener` 注解的方法参数（比如 `Order order`）需要 `MessageConverter` 把接收到的 JSON 消息反序列化成 Java 对象。

Spring Boot 在两边都会检查 `MessageConverter` 类型的 Bean，你只需在两边的 Spring Boot 应用中分别做同样的配置即可。