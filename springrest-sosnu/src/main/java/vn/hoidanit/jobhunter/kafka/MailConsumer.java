// package vn.hoidanit.JobZone.kafka;
//
// import org.springframework.kafka.annotation.KafkaListener;
// import org.springframework.stereotype.Component;
//
// import vn.hoidanit.JobZone.domain.entity.Job;
// import vn.hoidanit.JobZone.domain.response.email.ResEmailJob;
// import vn.hoidanit.JobZone.repository.JobRepository;
// import vn.hoidanit.JobZone.service.EmailService;
// import vn.hoidanit.JobZone.service.SubscriberService;
//
// import java.util.List;
//
// // MailConsumer.java
// import org.slf4j.Logger;
// import org.slf4j.LoggerFactory;
//
// @Component
// public class MailConsumer {
//
// private static final Logger log =
// LoggerFactory.getLogger(MailConsumer.class);
//
// private final JobRepository jobRepository;
// private final EmailService emailService;
// private final SubscriberService subscriberService; // để dùng
// convertJobToSendEmail
//
// public MailConsumer(JobRepository jobRepository,
// EmailService emailService,
// SubscriberService subscriberService) {
// this.jobRepository = jobRepository;
// this.emailService = emailService;
// this.subscriberService = subscriberService;
// }
//
// @KafkaListener(topics = "${app.kafka.topics.mail}")
// public void onMailCommand(MailCommand cmd) {
// log.info("Kafka received -> to={}, subject={}, template={}, jobIds={}",
// cmd.getTo(), cmd.getSubject(), cmd.getTemplateName(),
// cmd.getJobIds() != null ? cmd.getJobIds().size() : 0);
//
// // 1) Tự query DB theo jobIds
// List<Job> jobs =
// jobRepository.findAllWithCompanyAndSkillsByIdIn(cmd.getJobIds());
//
// // 2) Map sang ResEmailJob giống logic cũ
// List<ResEmailJob> arr = jobs.stream()
// .map(subscriberService::convertJobToSendEmail)
// .toList();
//
// // 3) Gửi email bằng template "job"
// emailService.sendEmailFromTemplateSync(
// cmd.getTo(),
// cmd.getSubject(),
// cmd.getTemplateName(),
// cmd.getUsername(),
// arr);
// }
// }
