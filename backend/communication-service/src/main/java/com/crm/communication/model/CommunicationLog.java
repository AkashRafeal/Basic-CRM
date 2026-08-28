package com.crm.communication.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_communication_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thread_id", length = 100)
    private String threadId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CommunicationChannel channel = CommunicationChannel.EMAIL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CommunicationDirection direction = CommunicationDirection.OUTGOING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private PriorityLevel priority = PriorityLevel.NORMAL;

    @Column(nullable = false, length = 300)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(length = 500)
    private String snippet;

    // Recipient Info
    @Column(length = 150)
    private String recipientName;

    @Column(length = 200)
    private String recipientAddress; // Email address, phone, or handle

    // Sender Info
    @Column(length = 150)
    private String senderName;

    @Column(length = 200)
    private String senderAddress;

    // Associated CRM Record
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RelatedEntityType relatedToType = RelatedEntityType.GENERAL;

    @Column(name = "related_to_id")
    private Long relatedToId;

    @Column(length = 200)
    private String relatedToName;

    private Long assignedToUserId;

    @Column(length = 150)
    private String assignedToUserName;

    // Tracking & Engagement
    @Builder.Default
    private Boolean isStarred = false;

    @Builder.Default
    private Boolean isRead = true;

    @Builder.Default
    private Integer openCount = 0;

    @Builder.Default
    private Integer clickCount = 0;

    @Column(length = 500)
    private String attachmentNames;

    private LocalDateTime scheduledAt;

    private LocalDateTime sentAt;

    private LocalDateTime deliveredAt;

    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
