package com.crm.communication.dto;

import com.crm.communication.model.CommunicationChannel;
import com.crm.communication.model.PriorityLevel;
import com.crm.communication.model.RelatedEntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotNull(message = "Channel is required")
    private CommunicationChannel channel;

    @NotBlank(message = "Recipient address (email/phone) is required")
    private String recipientAddress;

    private String recipientName;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Message body is required")
    private String body;

    private PriorityLevel priority;

    private RelatedEntityType relatedToType;

    private Long relatedToId;

    private String relatedToName;

    private Long assignedToUserId;

    private String assignedToUserName;

    private String threadId;

    private String attachmentNames;
}
